#!/bin/bash

# GCP Deployment Script for Portfolio Risk App
# Usage: ./deploy.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
BACKEND_SERVICE="portfolio-backend"
FRONTEND_SERVICE="portfolio-frontend"
DB_INSTANCE="portfolio-db"
DB_NAME="portfolio_db"
DB_USER="portfolio_user"

echo "=========================================="
echo "  Portfolio Risk App - GCP Deployment"
echo "=========================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required GCP APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# Create Artifact Registry repository (if not exists)
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create portfolio-app \
    --repository-format=docker \
    --location=$REGION \
    --description="Portfolio Risk App Docker images" \
    2>/dev/null || echo "Repository already exists"

# Configure Docker auth
gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

# =====================
# Cloud SQL Setup
# =====================
echo ""
echo "Setting up Cloud SQL..."

# Check if instance exists
if ! gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID &>/dev/null; then
    echo "Creating Cloud SQL instance (this takes ~5 minutes)..."
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$(openssl rand -base64 32) \
        --storage-auto-increase \
        --availability-type=zonal

    echo "Creating database..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE

    echo "Creating user..."
    DB_PASSWORD=$(openssl rand -base64 24)
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE \
        --password=$DB_PASSWORD

    # Store password in Secret Manager
    echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=-
    echo "Database password stored in Secret Manager"
else
    echo "Cloud SQL instance already exists"
fi

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
echo "Cloud SQL Connection: $CONNECTION_NAME"

# =====================
# Create Secrets
# =====================
echo ""
echo "Setting up secrets..."

# JWT Secret
if ! gcloud secrets describe jwt-secret &>/dev/null; then
    echo -n "$(openssl rand -base64 64)" | gcloud secrets create jwt-secret --data-file=-
fi

# =====================
# Build & Deploy Backend
# =====================
echo ""
echo "Building and deploying backend..."

cd backend

# Build image
docker build -f Dockerfile.prod -t $REGION-docker.pkg.dev/$PROJECT_ID/portfolio-app/$BACKEND_SERVICE:latest .

# Push to Artifact Registry
docker push $REGION-docker.pkg.dev/$PROJECT_ID/portfolio-app/$BACKEND_SERVICE:latest

# Deploy to Cloud Run
gcloud run deploy $BACKEND_SERVICE \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/portfolio-app/$BACKEND_SERVICE:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances=$CONNECTION_NAME \
    --set-env-vars="DATABASE_URL=postgresql://$DB_USER:@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME" \
    --set-secrets="JWT_SECRET_KEY=jwt-secret:latest,DB_PASSWORD=db-password:latest" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --port=8080

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format='value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

cd ..

# =====================
# Build & Deploy Frontend
# =====================
echo ""
echo "Building and deploying frontend..."

cd frontend

# Build image with backend URL
docker build \
    --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL \
    -t $REGION-docker.pkg.dev/$PROJECT_ID/portfolio-app/$FRONTEND_SERVICE:latest .

# Push to Artifact Registry
docker push $REGION-docker.pkg.dev/$PROJECT_ID/portfolio-app/$FRONTEND_SERVICE:latest

# Deploy to Cloud Run
gcloud run deploy $FRONTEND_SERVICE \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/portfolio-app/$FRONTEND_SERVICE:latest \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --set-env-vars="NEXT_PUBLIC_API_URL=$BACKEND_URL" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=10 \
    --port=3000

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format='value(status.url)')

cd ..

# =====================
# Update Backend CORS
# =====================
echo ""
echo "Updating backend CORS settings..."

gcloud run services update $BACKEND_SERVICE \
    --region=$REGION \
    --update-env-vars="CORS_ORIGINS=$FRONTEND_URL"

# =====================
# Summary
# =====================
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL:  $BACKEND_URL"
echo ""
echo "Cloud SQL Instance: $DB_INSTANCE"
echo "Database: $DB_NAME"
echo ""
echo "Next steps:"
echo "1. Run database migrations:"
echo "   gcloud run jobs execute db-migrate --region=$REGION"
echo ""
echo "2. Set up custom domain (optional):"
echo "   gcloud run domain-mappings create --service=$FRONTEND_SERVICE --domain=yourdomain.com"
echo ""
echo "3. Monitor your services:"
echo "   https://console.cloud.google.com/run?project=$PROJECT_ID"
