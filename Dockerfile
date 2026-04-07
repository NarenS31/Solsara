# Use when Railway Root Directory is the repo root (.).
# Installs only backend/requirements.txt (avoids root requirements.txt / Nixpacks heaviness).
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
