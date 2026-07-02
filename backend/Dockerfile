FROM python:3.12-slim-bookworm

# System dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injects PORT (default 10000). --preload boots the app before forking
# workers, cutting cold-start time and preventing port-open timeout on free tier.
CMD bash -c "gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --workers 1 --preload --bind 0.0.0.0:${PORT:-10000} --timeout 120"

