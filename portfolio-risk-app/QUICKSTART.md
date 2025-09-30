# Quick Start Guide

## 🚀 Running the Application

### Option 1: One-Command Start (Easiest)
```bash
./start.sh
```

### Option 2: Docker Compose
```bash
docker-compose up --build
```

### Option 3: Development Mode
```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Database (if not using Docker)
docker run -p 5432:5432 -e POSTGRES_PASSWORD=portfolio_pass -e POSTGRES_USER=portfolio_user -e POSTGRES_DB=portfolio_db postgres:15
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔑 First Login

1. Go to http://localhost:3000
2. Click "Get Started" or "Register"
3. Create your account
4. Login with your credentials
5. Start with the Risk Assessment

## 📁 Key Files to Explore

### For Understanding the Architecture:
- `backend/app/main.py` - FastAPI application entry point
- `frontend/src/app/page.tsx` - Landing page
- `docker-compose.yml` - Service orchestration

### For Authentication Flow:
- `backend/app/api/routes/auth.py` - Auth endpoints
- `frontend/src/lib/api.ts` - API client
- `frontend/src/app/(auth)/login/page.tsx` - Login UI

### For Core Features:
- `backend/app/models/` - Database models
- `frontend/src/app/(protected)/dashboard/page.tsx` - Main dashboard

## 🛠 Common Commands

### View Logs
```bash
docker-compose logs -f [service_name]
# Examples:
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
docker-compose restart [service_name]
```

### Reset Everything
```bash
docker-compose down -v  # Removes volumes too
docker-compose up --build
```

### Database Access
```bash
docker exec -it portfolio-db psql -U portfolio_user -d portfolio_db
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Docker Issues
```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

### Frontend Not Loading
1. Check if backend is running: http://localhost:8000
2. Check browser console for errors
3. Clear browser cache

### Database Connection Failed
1. Ensure PostgreSQL container is running
2. Check credentials in docker-compose.yml
3. Wait 10-15 seconds after starting for DB to initialize

## 📚 Next Steps

1. **Complete the Risk Assessment Module**
   - Add questionnaire questions
   - Implement scoring logic
   - Create risk profiles

2. **Build Portfolio Optimizer**
   - Implement Markowitz algorithm
   - Add ETF data
   - Create allocation engine

3. **Add Visualizations**
   - Portfolio pie charts
   - Risk/return scatter plots
   - Performance tracking

4. **Enhance Security**
   - Add 2FA
   - Implement rate limiting
   - Add audit logging

## 💡 Development Tips

- Backend auto-reloads on file changes
- Frontend has hot module replacement
- Use Docker logs to debug issues
- API docs at `/docs` are interactive

## 📞 Need Help?

Check the main README.md for detailed documentation or open an issue on GitHub.