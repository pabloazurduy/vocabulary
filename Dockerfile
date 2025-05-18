FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application (both backend and frontend)
COPY . .

# Environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Service must listen on $PORT environment variable
# Use gunicorn for production deployment
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 backend.main:app