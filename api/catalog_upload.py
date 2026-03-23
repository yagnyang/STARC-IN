"""
STARC — Catalog Upload Endpoint
Accepts CSV/Excel with RA/Dec columns, validates, converts to VOTable,
and serves it back so Aladin Lite can overlay it on the sky map.
"""

import io
import os
import uuid
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

VOTABLE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "votables")
os.makedirs(VOTABLE_DIR, exist_ok=True)

# Accepted RA/Dec column name variants
RA_ALIASES  = ["ra", "right_ascension", "raj2000", "ra_deg", "_ra"]
DEC_ALIASES = ["dec", "declination", "dej2000", "dec_deg", "_de", "de"]


def find_col(columns: list[str], aliases: list[str]) -> str | None:
    """Case-insensitive column name matcher."""
    col_map = {c.lower().strip(): c for c in columns}
    for alias in aliases:
        if alias in col_map:
            return col_map[alias]
    return None


def validate(df: pd.DataFrame) -> dict:
    """
    Validate the uploaded dataframe.
    Returns a report dict with status, issues, and resolved column names.
    """
    issues = []
    warnings = []

    cols = df.columns.tolist()
    ra_col  = find_col(cols, RA_ALIASES)
    dec_col = find_col(cols, DEC_ALIASES)

    if not ra_col:
        issues.append("No RA column found. Expected one of: ra, right_ascension, raj2000, ra_deg")
    if not dec_col:
        issues.append("No Dec column found. Expected one of: dec, declination, dej2000, dec_deg")

    if issues:
        return {"ok": False, "issues": issues, "warnings": warnings, "ra_col": None, "dec_col": None}

    # Coerce to numeric
    df[ra_col]  = pd.to_numeric(df[ra_col],  errors="coerce")
    df[dec_col] = pd.to_numeric(df[dec_col], errors="coerce")

    # Null check
    ra_nulls  = df[ra_col].isna().sum()
    dec_nulls = df[dec_col].isna().sum()
    if ra_nulls > 0:
        warnings.append(f"{ra_nulls} rows have missing RA values — they will be skipped.")
    if dec_nulls > 0:
        warnings.append(f"{dec_nulls} rows have missing Dec values — they will be skipped.")

    # Range check
    invalid_ra  = ((df[ra_col]  < 0) | (df[ra_col]  > 360)).sum()
    invalid_dec = ((df[dec_col] < -90) | (df[dec_col] > 90)).sum()
    if invalid_ra > 0:
        warnings.append(f"{invalid_ra} rows have RA outside 0–360°.")
    if invalid_dec > 0:
        warnings.append(f"{invalid_dec} rows have Dec outside -90–90°.")

    total = len(df)
    clean = df[ra_col].notna() & df[dec_col].notna()
    usable = clean.sum()

    return {
        "ok": True,
        "issues": issues,
        "warnings": warnings,
        "ra_col": ra_col,
        "dec_col": dec_col,
        "total_rows": total,
        "usable_rows": int(usable),
    }


def to_votable(df: pd.DataFrame, ra_col: str, dec_col: str, filename: str) -> str:
    """Convert clean dataframe to VOTable XML and save to disk."""
    try:
        from astropy.table import Table
        from astropy.io.votable import from_table, writeto
        import astropy.units as u
    except ImportError:
        raise HTTPException(status_code=500, detail="astropy not installed. Run: pip install astropy")

    # Drop rows with missing coords
    df = df[df[ra_col].notna() & df[dec_col].notna()].copy()

    # Rename to standard RA/Dec for Aladin
    df = df.rename(columns={ra_col: "RA", dec_col: "Dec"})

    # Keep only serializable columns
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="ignore")

    table = Table.from_pandas(df)

    # Attach UCDs so Aladin knows which columns are coordinates
    for colname in table.colnames:
        if colname == "RA":
            table[colname].unit = u.deg
            table[colname].meta["ucd"] = "pos.eq.ra;meta.main"
        elif colname == "Dec":
            table[colname].unit = u.deg
            table[colname].meta["ucd"] = "pos.eq.dec;meta.main"

    vot = from_table(table)
    out_path = os.path.join(VOTABLE_DIR, filename)
    writeto(vot, out_path)
    return out_path


@router.post("/api/upload-catalog")
async def upload_catalog(file: UploadFile = File(...)):
    """
    Accept CSV or Excel, validate, convert to VOTable.
    Returns validation report + a URL to fetch the VOTable.
    """
    ext = os.path.splitext(file.filename or "")[-1].lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")

    contents = await file.read()

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    # Normalize column names
    df.columns = [c.strip() for c in df.columns]

    report = validate(df)

    if not report["ok"]:
        return {
            "status": "error",
            "issues": report["issues"],
            "warnings": [],
        }

    # Convert to VOTable
    vot_filename = f"{uuid.uuid4().hex}.vot"
    try:
        to_votable(df, report["ra_col"], report["dec_col"], vot_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VOTable conversion failed: {e}")

    return {
        "status": "ok",
        "issues": report["issues"],
        "warnings": report["warnings"],
        "total_rows": report["total_rows"],
        "usable_rows": report["usable_rows"],
        "votable_url": f"/api/votable/{vot_filename}",
    }


@router.get("/api/votable/{filename}")
def serve_votable(filename: str):
    """Serve a previously generated VOTable file."""
    path = os.path.join(VOTABLE_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="VOTable not found.")
    return FileResponse(path, media_type="application/xml", filename=filename)
