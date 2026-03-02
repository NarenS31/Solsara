FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app into backend/ so "backend" is a proper package (needed for relative imports)
COPY . ./backend

# Railway sets PORT; default to 8000 for local
ENV PORT=8000
EXPOSE $PORT

CMD uvicorn backend.main:app --host 0.0.0.0 --port $PORT
