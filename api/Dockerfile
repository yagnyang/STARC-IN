FROM python:3.10-slim

WORKDIR /app

# Install native dependencies if requied by astropy, duckdb etc
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend logic
COPY api/ api/
COPY config/ config/

ENV PYTHONPATH=/app

EXPOSE 8000
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
