# GCP Deployment Guide - Portfolio Risk App

This guide walks you through deploying the Portfolio Risk App on Google Cloud Platform using **Cloud Run** (serverless containers) and **Cloud SQL** (managed PostgreSQL).

## Architecture Overview

```
                    ┌─────────────────┐
                    │   Cloud DNS     │
                    │  (optional)     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌──────────▼─────────┐
    │   Cloud Run       │       │    Cloud Run       │
    │   (Frontend)      │──────▶│    (Backend)       │
    │   Next.js         │       │    FastAPI         │
    └───────────────────┘       └──────────┬─────────┘
                                           │
                                ┌──────────▼─────────┐
                                │    Cloud SQL       │
                                │   (PostgreSQL)     │
                                └────────────────────┘
```

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Docker** installed locally
4. **Git** for version control

## Cost Estimate (Free Tier Eligible)

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Cloud Run | 2M requests/month | ~$0-5/month |
| Cloud SQL | None (db-f1-micro ~$7/month) | ~$7-10/month |
| Artifact Registry | 500MB free | ~$0/month |
| **Total** | | **~$7-15/month** |

## Quick Start (Automated)

```bash
# 1. Clone the repository
git clone https://github.com/pratikk455/Risk-Minimized-Portfolio-Construction-through-Algorithmic-Modeling.git
cd portfolio-risk-app

# 2. Login to GCP
gcloud auth login
gcloud auth application-default login

# 3. Run deployment script
./deploy.sh YOUR_PROJECT_ID us-central1
```

## Step-by-Step Manual Deployment

### Step 1: Set Up GCP Project

```bash
# Create a new project (or use existing)
gcloud projects create hedgewise-portfolio --name="Hedgewise Portfolio"

# Set as active project
gcloud config set project hedgewise-portfolio

# Link billing account
gcloud billing accounts list
gcloud billing projects link hedgewise-portfolio --billing-account=YOUR_BILLING_ACCOUNT_ID

# Enable required APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com
```

### Step 2: Create Cloud SQL Instance

```bash
# Create PostgreSQL instance (takes ~5 minutes)
gcloud sql instances create portfolio-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-auto-increase \
    --availability-type=zonal

# Create database
gcloud sql databases create portfolio_db --instance=portfolio-db

# Create user (save this password!)
gcloud sql users create portfolio_user \
    --instance=portfolio-db \
    --password=YOUR_SECURE_PASSWORD

# Store password in Secret Manager
echo -n "YOUR_SECURE_PASSWORD" | gcloud secrets create db-password --data-file=-

# Create JWT secret
openssl rand -base64 64 | gcloud secrets create jwt-secret --data-file=-
```

### Step 3: Create Artifact Registry

```bash
# Create Docker repository
gcloud artifacts repositories create portfolio-app \
    --repository-format=docker \
    --location=us-central1

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Step 4: Deploy Backend

```bash
cd backend

# Build Docker image
docker build -f Dockerfile.prod \
    -t us-central1-docker.pkg.dev/hedgewise-portfolio/portfolio-app/backend:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/hedgewise-portfolio/portfolio-app/backend:latest

# Get Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe portfolio-db --format='value(connectionName)')

# Deploy to Cloud Run
gcloud run deploy portfolio-backend \
    --image=us-central1-docker.pkg.dev/hedgewise-portfolio/portfolio-app/backend:latest \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --add-cloudsql-instances=$CONNECTION_NAME \
    --set-env-vars="DATABASE_URL=postgresql://portfolio_user:@/portfolio_db?host=/cloudsql/$CONNECTION_NAME" \
    --set-secrets="JWT_SECRET_KEY=jwt-secret:latest" \
    --memory=512Mi \
    --cpu=1 \
    --port=8080

# Get backend URL
BACKEND_URL=$(gcloud run services describe portfolio-backend --region=us-central1 --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

### Step 5: Deploy Frontend

```bash
cd ../frontend

# Build with backend URL
docker build \
    --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL \
    -t us-central1-docker.pkg.dev/hedgewise-portfolio/portfolio-app/frontend:latest .

# Push to Artifact Registry
docker push us-central1-docker.pkg.dev/hedgewise-portfolio/portfolio-app/frontend:latest

# Deploy to Cloud Run
gcloud run deploy portfolio-frontend \
    --image=us-central1-docker.pkg.dev/hedgewise-portfolio/portfolio-app/frontend:latest \
    --platform=managed \
    --region=us-central1 \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --port=3000

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe portfolio-frontend --region=us-central1 --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

### Step 6: Update CORS Settings

```bash
gcloud run services update portfolio-backend \
    --region=us-central1 \
    --update-env-vars="CORS_ORIGINS=$FRONTEND_URL"
```

## Environment Variables

### Backend (Cloud Run)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | JWT signing key (from Secret Manager) |
| `CORS_ORIGINS` | Allowed frontend URLs |
| `ALPACA_API_KEY` | Alpaca trading API key |
| `ALPACA_SECRET_KEY` | Alpaca trading secret |
| `GEMINI_API_KEY` | Google Gemini AI API key |

### Frontend (Cloud Run)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Adding API Keys

```bash
# Add Alpaca keys
gcloud secrets create alpaca-api-key --data-file=- <<< "YOUR_ALPACA_API_KEY"
gcloud secrets create alpaca-secret-key --data-file=- <<< "YOUR_ALPACA_SECRET"

# Add Gemini API key
gcloud secrets create gemini-api-key --data-file=- <<< "YOUR_GEMINI_API_KEY"

# Update backend with secrets
gcloud run services update portfolio-backend \
    --region=us-central1 \
    --set-secrets="ALPACA_API_KEY=alpaca-api-key:latest,ALPACA_SECRET_KEY=alpaca-secret-key:latest,GEMINI_API_KEY=gemini-api-key:latest"
```

## Custom Domain Setup

```bash
# Verify domain ownership
gcloud domains verify yourdomain.com

# Map domain to frontend
gcloud run domain-mappings create \
    --service=portfolio-frontend \
    --domain=yourdomain.com \
    --region=us-central1

# Map api subdomain to backend
gcloud run domain-mappings create \
    --service=portfolio-backend \
    --domain=api.yourdomain.com \
    --region=us-central1
```

## CI/CD with Cloud Build

Create `cloudbuild.yaml` in root:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'backend/Dockerfile.prod', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/backend:$SHORT_SHA', 'backend']

  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '--build-arg', 'NEXT_PUBLIC_API_URL=https://portfolio-backend-xxxxx-uc.a.run.app', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/frontend:$SHORT_SHA', 'frontend']

  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/backend:$SHORT_SHA']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/frontend:$SHORT_SHA']

  # Deploy backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', 'portfolio-backend', '--image', 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/backend:$SHORT_SHA', '--region', 'us-central1']

  # Deploy frontend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', 'portfolio-frontend', '--image', 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/frontend:$SHORT_SHA', '--region', 'us-central1']

images:
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/backend:$SHORT_SHA'
  - 'us-central1-docker.pkg.dev/$PROJECT_ID/portfolio-app/frontend:$SHORT_SHA'
```

Connect to GitHub:
```bash
gcloud builds triggers create github \
    --repo-name=Risk-Minimized-Portfolio-Construction-through-Algorithmic-Modeling \
    --repo-owner=pratikk455 \
    --branch-pattern="^master$" \
    --build-config=cloudbuild.yaml
```

## Monitoring & Logs

```bash
# View backend logs
gcloud run logs read portfolio-backend --region=us-central1

# View frontend logs
gcloud run logs read portfolio-frontend --region=us-central1

# Stream live logs
gcloud run logs tail portfolio-backend --region=us-central1
```

## Troubleshooting

### Database Connection Issues
```bash
# Test Cloud SQL connectivity
gcloud sql connect portfolio-db --user=portfolio_user

# Check instance status
gcloud sql instances describe portfolio-db
```

### Container Startup Issues
```bash
# Check Cloud Run service status
gcloud run services describe portfolio-backend --region=us-central1

# View container logs
gcloud run logs read portfolio-backend --region=us-central1 --limit=100
```

### CORS Errors
Ensure the frontend URL is in `CORS_ORIGINS`:
```bash
gcloud run services update portfolio-backend \
    --region=us-central1 \
    --update-env-vars="CORS_ORIGINS=https://your-frontend-url.run.app"
```

## Cleanup

To remove all resources:
```bash
# Delete Cloud Run services
gcloud run services delete portfolio-frontend --region=us-central1
gcloud run services delete portfolio-backend --region=us-central1

# Delete Cloud SQL instance
gcloud sql instances delete portfolio-db

# Delete secrets
gcloud secrets delete jwt-secret
gcloud secrets delete db-password

# Delete Artifact Registry
gcloud artifacts repositories delete portfolio-app --location=us-central1
```

## Support

For issues, open a GitHub issue or check:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
