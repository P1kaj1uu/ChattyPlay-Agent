# HuggingFace Space — OpenClaw Virtual Office
# Docker SDK image. Serves the FastAPI app on port 7860.

FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project (app, dashboard, assets, config).
COPY . .

EXPOSE 7860

# FastAPI listens on 0.0.0.0:7860 — the port declared in README.md (app_port).
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
