FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (better layer cache).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code.
COPY flowmind/ flowmind/
COPY config/   config/

ENV PYTHONPATH=/app
ENV FLASK_HOST=0.0.0.0
ENV FLASK_PORT=5050

EXPOSE 5050

CMD ["python", "flowmind/api.py"]
