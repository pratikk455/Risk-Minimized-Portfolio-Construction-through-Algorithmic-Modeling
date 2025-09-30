# Portfolio Risk Management System

A sophisticated web application that democratizes institutional-grade portfolio construction through advanced risk minimization algorithms.

## Features

- **Risk Assessment**: Interactive questionnaire to determine investor risk profile
- **Portfolio Construction**: AI-powered portfolio optimization using Markowitz and HRP algorithms
- **Real-time Analytics**: Track performance metrics, Sharpe ratios, and volatility
- **Educational Content**: Learn about portfolio theory and risk management
- **Secure Authentication**: JWT-based auth with refresh tokens

## Tech Stack

### Backend
- FastAPI (Python 3.11)
- PostgreSQL database
- SQLAlchemy ORM
- Redis for caching
- yfinance for market data

### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- Recharts for visualizations
- Framer Motion for animations

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker (Recommended)

1. Clone the repository:
```bash
cd portfolio-risk-app
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Ports
- Frontend: 3000
- Backend: 8000
- PostgreSQL: 5432
- Redis: 6379

## Development Setup

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
portfolio-risk-app/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Core configs
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py       # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities
│   │   └── hooks/        # Custom hooks
│   ├── package.json
│   └── Dockerfile.dev
└── docker-compose.yml
```

## First Steps After Setup

1. Register a new account at http://localhost:3000/register
2. Login with your credentials
3. Complete the risk assessment questionnaire
4. View your personalized portfolio recommendations
5. Track portfolio performance in the dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile

### Assessment
- `POST /api/assessment/start` - Start new assessment
- `POST /api/assessment/submit` - Submit assessment responses
- `GET /api/assessment/history` - Get assessment history

### Portfolio
- `POST /api/portfolio/generate` - Generate portfolio from assessment
- `GET /api/portfolio/active` - Get active portfolio
- `GET /api/portfolio/history` - Get portfolio history

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://portfolio_user:portfolio_pass@postgres:5432/portfolio_db
JWT_SECRET_KEY=your-secret-key-change-this-in-production
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Next Steps for Development

1. **Implement Risk Assessment Logic**
   - Create questionnaire questions bank
   - Implement scoring algorithm
   - Map scores to risk profiles

2. **Add Portfolio Optimization**
   - Implement Markowitz optimization
   - Add HRP algorithm
   - Create ETF universe database

3. **Enhance Visualizations**
   - Add interactive charts
   - Create correlation matrices
   - Implement Monte Carlo simulations

4. **Add Real-time Data**
   - Integrate Yahoo Finance API
   - Add WebSocket for live updates
   - Implement price alerts

5. **Security Enhancements**
   - Add Duo 2FA integration
   - Implement rate limiting
   - Add input validation

## License

MIT