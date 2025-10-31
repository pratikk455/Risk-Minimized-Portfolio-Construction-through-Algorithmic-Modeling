# Railway Deployment Guide - Portfolio Risk App

This guide will walk you through deploying your Portfolio Risk Application to Railway.

## 📋 Prerequisites

- GitHub account (you already have the repo)
- Railway account (free - sign up at https://railway.app)
- Your code pushed to GitHub

## 🚀 Step-by-Step Deployment

### Step 1: Push Your Latest Changes to GitHub

```bash
cd "/Users/pratikshrestha/CSC 475/portfolio-risk-app"

# Add all the new configuration files
git add .
git commit -m "Add Railway deployment configuration"
git push origin master
```

### Step 2: Create Railway Account

1. Go to https://railway.app
2. Click **"Login"** or **"Start a New Project"**
3. Sign up with GitHub (recommended) or email
4. Authorize Railway to access your GitHub repositories

### Step 3: Create a New Project

1. Once logged in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Search for and select: `Risk-Minimized-Portfolio-Construction-through-Algorithmic-Modeling`
4. Railway will detect your repository

### Step 4: Deploy PostgreSQL Database

1. In your Railway project, click **"New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will automatically create a PostgreSQL instance
5. Note: Railway automatically sets the `DATABASE_URL` environment variable

### Step 5: Deploy Redis (Optional but Recommended)

1. Click **"New"** again
2. Select **"Database"**
3. Choose **"Redis"**
4. Railway will create a Redis instance
5. The `REDIS_URL` will be automatically available

### Step 6: Deploy Backend Service

1. Click **"New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will ask for the **root directory**
4. Set root directory to: `backend`
5. Railway will auto-detect it's a Python app

**Backend Environment Variables:**

Click on the backend service → **"Variables"** tab → Add these:

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
REDIS_URL = ${{Redis.REDIS_URL}}
JWT_SECRET_KEY = your-super-secret-key-change-this-to-something-random
CORS_ORIGINS = https://your-frontend-url.railway.app
ENVIRONMENT = production

# Optional Email Settings (if you want email functionality)
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASSWORD = your-app-specific-password
EMAIL_FROM = noreply@portfolio-risk.com
```

**Important:**
- Replace `your-frontend-url.railway.app` with your actual frontend URL (you'll get this in Step 7)
- Generate a secure JWT_SECRET_KEY (you can use any random 32+ character string)

6. Click **"Deploy"**
7. Wait for deployment to complete (~2-3 minutes)
8. Once deployed, click **"Settings"** → **"Networking"** → **"Generate Domain"**
9. Copy your backend URL (e.g., `https://your-backend.railway.app`)

### Step 7: Deploy Frontend Service

1. Click **"New"** → **"GitHub Repo"**
2. Select your repository again
3. Set root directory to: `frontend`
4. Railway will auto-detect it's a Next.js app

**Frontend Environment Variables:**

Click on the frontend service → **"Variables"** tab → Add:

```
NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app
```

Replace with your actual backend URL from Step 6.

5. Click **"Deploy"**
6. Wait for deployment (~3-5 minutes for Next.js build)
7. Once deployed, click **"Settings"** → **"Networking"** → **"Generate Domain"**
8. Copy your frontend URL (e.g., `https://your-frontend.railway.app`)

### Step 8: Update Backend CORS Settings

1. Go back to your **backend service**
2. Click **"Variables"**
3. Update `CORS_ORIGINS` to your frontend URL:
   ```
   CORS_ORIGINS = https://your-frontend.railway.app
   ```
4. Click **"Deploy"** to restart with new settings

### Step 9: Initialize Database

The database tables should be created automatically on first backend startup. If not:

1. Click on your **backend service**
2. Go to **"Deployments"** tab
3. Check the logs - you should see "Creating database tables..."
4. If you need to manually run migrations:
   - Railway doesn't have direct shell access, but your app should auto-create tables on startup

### Step 10: Test Your Deployment

1. Visit your frontend URL: `https://your-frontend.railway.app`
2. Try the following:
   - Homepage loads correctly
   - Navigate to `/assessment`
   - Complete the risk assessment
   - Click "Generate My Portfolio"
   - View the portfolio page with all 14 ETFs

## 🎯 Your Live URLs

After deployment, you'll have:

- **Frontend**: `https://your-app-name.railway.app`
- **Backend API**: `https://your-backend.railway.app`
- **API Docs**: `https://your-backend.railway.app/docs`
- **Database**: Managed by Railway (internal URL)
- **Redis**: Managed by Railway (internal URL)

## 💰 Railway Pricing

- **Free Tier**: $5 credit per month (good for hobby projects)
- Each service uses credits based on:
  - RAM usage
  - CPU usage
  - Network egress

**Estimated Monthly Cost:**
- Small app like yours: ~$5-10/month
- Free tier should cover development/testing

## 🔧 Troubleshooting

### Frontend Can't Connect to Backend

1. Check `NEXT_PUBLIC_API_URL` in frontend variables
2. Check `CORS_ORIGINS` in backend variables
3. Make sure both match your actual deployed URLs

### Database Connection Errors

1. Verify `DATABASE_URL` is set correctly
2. Check backend logs for connection errors
3. Ensure PostgreSQL service is running

### Backend Won't Start

1. Check deployment logs in Railway
2. Verify all environment variables are set
3. Check `requirements.txt` for missing dependencies

### 500 Errors

1. Check backend logs in Railway dashboard
2. Verify JWT_SECRET_KEY is set
3. Check database migrations ran successfully

## 📝 Making Updates

After your app is deployed, to make changes:

```bash
# Make your code changes locally
git add .
git commit -m "Your update message"
git push origin master
```

Railway will automatically detect the push and redeploy! 🎉

## 🔒 Security Recommendations

1. **Never commit `.env` files** to GitHub
2. Use Railway's environment variables for secrets
3. Generate a strong JWT_SECRET_KEY (32+ random characters)
4. Keep your SMTP credentials secure
5. Enable GitHub branch protection on `master`

## 📊 Monitoring

Railway provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Track all deployments
- **Alerts**: Set up notifications for errors

Access these in your Railway dashboard for each service.

## 🎉 Success!

Once deployed, share your app:
- **Live App**: `https://your-frontend.railway.app`
- **API Docs**: `https://your-backend.railway.app/docs`

Your Portfolio Risk Assessment app is now live! 🚀

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/pratikk455/Risk-Minimized-Portfolio-Construction-through-Algorithmic-Modeling/issues
