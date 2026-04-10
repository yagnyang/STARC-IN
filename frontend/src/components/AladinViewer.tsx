import React, { useEffect, useRef, useState } from 'react';

interface UploadReport {
    status: "ok" | "error";
    issues: string[];
    warnings: string[];
    total_rows?: number;
    usable_rows?: number;
    votable_url?: string;
}

const AladinViewer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const aladinRef = useRef<any>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('TRAPPIST-1');

    // Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadReport, setUploadReport] = useState<UploadReport | null>(null);
    const [overlayName, setOverlayName] = useState<string | null>(null);

    useEffect(() => {
        let tries = 0;
        const poll = setInterval(() => {
            tries++;
            if (window.A && containerRef.current) {
                clearInterval(poll);
                try {
                    aladinRef.current = window.A.aladin(containerRef.current, {
                        survey: 'P/DSS2/color',
                        fov: 0.5,
                        target: 'TRAPPIST-1',
                        showReticle: true,
                        showZoomControl: true,
                        showFullscreenControl: true,
                        showLayersControl: true,
                        showGotoControl: true,
                        showShareControl: false,
                    });
                    setReady(true);
                } catch (e) {
                    setError('Failed to initialize Aladin Lite.');
                }
            } else if (tries > 100) {
                clearInterval(poll);
                setError('Aladin Lite failed to load. Check your internet connection and reload the page.');
            }
        }, 100);
        return () => clearInterval(poll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchInput.trim();
        if (!q || !aladinRef.current) return;
        setError(null);
        aladinRef.current.gotoObject(q, {
            success: () => { },
            error: () => setError(`Could not resolve "${q}" via SIMBAD.`),
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadReport(null);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/upload-catalog`, {
                method: "POST",
                body: formData,
            });

            const report: UploadReport | { detail: string } = await res.json();

            if (!res.ok) {
                // If it's a validation or server error not shaped as UploadReport
                const msg = (report as { detail: string }).detail || "Unknown error";
                setError(`Validation failed: ${msg}`);
                return;
            }

            const validReport = report as UploadReport;
            setUploadReport(validReport);

            if (validReport.status === "ok" && validReport.votable_url && aladinRef.current) {
                const fullUrl = `${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}${validReport.votable_url}`;
                const catName = file.name.replace(/\.[^.]+$/, "");
                setOverlayName(catName);

                try {
                    // Load VOTable as an Aladin catalog overlay
                    // Aladin V3 returns a Promise, V2 returns an object synchronously
                    let cat = window.A.catalogFromURL(fullUrl, {
                        name: catName,
                        color: "#00d4ff",
                        sourceSize: 10,
                        onClick: "showTable",
                    });

                    if (cat && typeof cat.then === 'function') {
                        cat = await cat;
                    }

                    aladinRef.current.addCatalog(cat);

                    const zoomToFirst = () => {
                        try {
                            const sources = cat.getSources();
                            if (sources && sources.length > 0) {
                                aladinRef.current.gotoRaDec(sources[0].ra, sources[0].dec);
                            }
                        } catch (e) {
                            console.warn("Could not zoom to first object:", e);
                        }
                    };

                    if (typeof cat.on === 'function') {
                        cat.on("loaded", zoomToFirst);
                    } else {
                        // V3 Promise already waits for it to load
                        zoomToFirst();
                    }
                } catch (catErr) {
                    console.error("Aladin overlay error:", catErr);
                    setError("Catalog uploaded, but Aladin failed to render the layer.");
                }
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError("Upload failed. Is the STARC API running on port 8000?");
        } finally {
            setUploading(false);
            // Reset file input so same file can be re-uploaded
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col w-full" style={{ height: 'calc(100vh - 88px)' }}>
            {/* Top bar */}
            <div className="flex flex-wrap items-center gap-3 justify-between px-6 py-3 bg-[#131318] border-b border-primary/20 shrink-0 repository-bar">
                <span className="font-mono text-[13px] text-primary uppercase tracking-widest">
                    CDS Aladin Lite — Stellar Sky Archive
                </span>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="bg-black/60 border border-primary/30 px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-primary w-56 repository-input"
                        placeholder="Target / coordinates"
                    />
                    <button
                        type="submit"
                        className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors repository-btn"
                    >
                        Resolve
                    </button>
                </form>

                {/* Upload */}
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || !ready}
                        className="bg-primary/10 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 repository-btn"
                    >
                        {uploading ? (
                            <>
                                <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin inline-block" />
                                Processing...
                            </>
                        ) : (
                            <>↑ Upload Catalog</>
                        )}
                    </button>
                    {overlayName && (
                        <span className="font-mono text-[13px] text-primary/70 uppercase tracking-widest">
                            ● {overlayName} overlaid
                        </span>
                    )}
                </div>

                {error && <span className="font-mono text-[13px] text-red-400 w-full">{error}</span>}
            </div>

            {/* Upload Report Banner */}
            {uploadReport && (
                <div className={`px-6 py-2 border-b font-mono text-[13px] flex flex-wrap gap-4 items-center shrink-0 ${uploadReport.status === "ok"
                    ? "bg-teal-950/40 border-primary/20 text-primary"
                    : "bg-red-950/40 border-red-500/20 text-red-400"
                    }`}>
                    {uploadReport.status === "ok" ? (
                        <>
                            <span>✓ CATALOG LOADED</span>
                            <span>{uploadReport.usable_rows} / {uploadReport.total_rows} objects plotted</span>
                            {uploadReport.warnings.map((w, i) => (
                                <span key={i} className="text-amber-400">⚠ {w}</span>
                            ))}
                        </>
                    ) : (
                        uploadReport.issues.map((issue, i) => (
                            <span key={i}>✗ {issue}</span>
                        ))
                    )}
                </div>
            )}

            {/* Aladin Viewer */}
            <div className="relative flex-1 w-full bg-black overflow-hidden">
                {!ready && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-[#06010d]">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="font-mono text-xs text-primary animate-pulse uppercase tracking-widest">
                            Loading CDS Aladin Lite...
                        </span>
                    </div>
                )}
                {error && !ready && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-400 font-mono text-sm text-center px-8">
                        <div className="w-12 h-12 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-xl font-bold">!</div>
                        <p>{error}</p>
                    </div>
                )}
                <div ref={containerRef} className="w-full h-full" />
            </div>
        </div>
    );
};

export default AladinViewer;

declare global {
    interface Window { A: any; }
}
