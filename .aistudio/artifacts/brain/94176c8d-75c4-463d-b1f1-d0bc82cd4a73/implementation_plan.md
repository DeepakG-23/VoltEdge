# Implementation Plan - MongoDB & Flask Deployment on Railway

This plan outlines how to configure the `MONGO_PRIVATE_URL` / `MONGO_URL` environment variable on Railway and deploy the Python Flask backend service.

## User Requirements Addressed
1. Where to add the `MONGO_PRIVATE_URL` variable in Railway.
2. Instructions on deploying the Python Flask backend service to Railway.

## Proposed Changes

### 1. Railway Environment Variable Configuration
- **Step 1**: In the Railway dashboard, click on your **Flask/Backend service** (or create a service connected to your GitHub repository).
- **Step 2**: Go to the **Variables** tab of that service.
- **Step 3**: Click **New Variable** (or "Add Variable Reference").
- **Step 4**: Enter the variable name (e.g., `MONGO_PRIVATE_URL` or `MONGO_URL`) and paste `${{ MongoDB.MONGO_PRIVATE_URL }}` (or link it via Railway's Variable Reference dropdown selecting MongoDB).

### 2. Flask Backend Deployment Configuration on Railway
- **Procfile** (if needed): Ensure `backend/` has a `Procfile` or `gunicorn` start command.
- **`backend/requirements.txt`**: Already configured with `flask`, `flask-cors`, `pymongo`, `gunicorn`, `python-dotenv`.
- **`backend/app.py`**: Already configured to load `MONGO_PRIVATE_URL` or `MONGO_URL` automatically.

## Verification Plan
- Verify environment variables are visible in Railway.
- Check backend logs after deploy to confirm: `Connected to MongoDB successfully!`.
