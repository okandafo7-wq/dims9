# DIMS Technical Documentation
## Architecture, Implementation & Development Guide

**Version:** 1.0  
**Date:** December 2025  
**Technology Stack:** React + FastAPI + MongoDB

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Frontend Architecture](#frontend-architecture)
6. [Security Implementation](#security-implementation)
7. [Deployment Guide](#deployment-guide)
8. [Development Setup](#development-setup)

---

## System Architecture

### High-Level Architecture

```
┌────────────────────┐
│   Web Browser        │
│  (React Frontend)    │
└───────┬────────────┘
        │
        │ HTTPS/REST API
        │
┌───────┴────────────┐
│  FastAPI Backend     │
│  (Python)            │
│  - Auth & JWT        │
│  - Business Logic   │
│  - Data Validation  │
└───────┬────────────┘
        │
        │ MongoDB Driver
        │
┌───────┴────────────┐
│  MongoDB Database    │
│  - Users Collection  │
│  - Cooperatives      │
│  - Production Logs   │
│  - Nonconformities   │
└────────────────────┘
```

### Component Architecture

#### Backend Components
- **API Layer:** FastAPI routes and endpoints
- **Authentication:** JWT token generation and validation
- **Data Models:** Pydantic schemas for validation
- **Database Layer:** Motor (async MongoDB driver)
- **Business Logic:** Calculations, aggregations, validations

#### Frontend Components
- **Pages:** Role-specific views (Officer, Manager, Farmer)
- **Components:** Reusable UI elements (Shadcn UI)
- **State Management:** React hooks (useState, useEffect)
- **API Client:** Axios with interceptors
- **Routing:** React Router v6
- **Visualization:** Recharts library

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|----------|
| Python | 3.11+ | Runtime environment |
| FastAPI | 0.104+ | Web framework |
| Motor | 3.3+ | Async MongoDB driver |
| Pydantic | 2.0+ | Data validation |
| python-jose | 3.3+ | JWT handling |
| passlib | 1.7+ | Password hashing |
| bcrypt | 4.0+ | Cryptography |
| uvicorn | 0.24+ | ASGI server |

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|----------|
| React | 18.2+ | UI framework |
| React Router | 6.x | Client-side routing |
| Axios | 1.6+ | HTTP client |
| TailwindCSS | 3.x | Styling framework |
| Shadcn UI | - | Component library |
| Recharts | 2.x | Data visualization |
| Lucide React | - | Icon library |
| Sonner | - | Toast notifications |

### Database

| Technology | Purpose |
|------------|----------|
| MongoDB | 6.0+ | NoSQL document database |

### Development Tools

- **Version Control:** Git
- **Package Managers:** pip (Python), yarn (Node.js)
- **Process Manager:** Supervisor
- **Code Quality:** ESLint, Ruff

---

## Database Schema

### Collections Overview

1. **users** - User accounts and authentication
2. **cooperatives** - Cooperative organizations
3. **production_logs** - Production and quality data
4. **nonconformities** - ISO compliance issues

### Detailed Schema

#### users Collection

```json
{
  "id": "uuid-string",
  "email": "user@dims9.com",
  "password": "hashed_password_bcrypt",
  "name": "User Full Name",
  "role": "officer|manager|farmer",
  "cooperative_id": "uuid-string|null",
  "created_at": "2025-12-13T10:00:00Z"
}
```

**Indexes:**
- `email` (unique)
- `id` (unique)
- `role`
- `cooperative_id`

**Constraints:**
- email: Required, unique, valid email format
- password: Hashed with bcrypt (60 characters)
- role: Enum ["officer", "manager", "farmer"]
- cooperative_id: Required for manager/farmer, null for officer

#### cooperatives Collection

```json
{
  "id": "uuid-string",
  "name": "Green Valley Coffee Cooperative",
  "country": "Ethiopia",
  "product": "Coffee",
  "status": "active|pending|at_risk",
  "created_at": "2025-12-05T14:35:19Z"
}
```

**Indexes:**
- `id` (unique)
- `status`

**Sample Data:**
1. Green Valley Coffee Cooperative (Ethiopia, Coffee)
2. Mediterranean Olive Oil Cooperative (Tunisia, Olive Oil)
3. Tropical Fruit Farmers Union (Ghana, Tropical Fruits)
4. Andean Quinoa Collective (Peru, Quinoa)

#### production_logs Collection

```json
{
  "id": "uuid-string",
  "cooperative_id": "uuid-string",
  "date": "2025-12-10T00:00:00Z",
  "total_production": 500.5,
  "grade_a_percent": 85.0,
  "grade_b_percent": 12.0,
  "post_harvest_loss_percent": 3.5,
  "post_harvest_loss_kg": 17.5,
  "energy_use": "Low|Medium|High",
  "has_nonconformity": false,
  "nonconformity_description": "Optional description",
  "corrective_action": "Optional action",
  "created_at": "2025-12-10T08:30:00Z"
}
```

**Indexes:**
- `id` (unique)
- `cooperative_id`
- `date` (descending)

**Validation:**
- total_production: Positive number
- Percentages: 0-100 range
- grade_a_percent + grade_b_percent ≤ 100
- energy_use: Enum ["Low", "Medium", "High"]

#### nonconformities Collection

```json
{
  "id": "uuid-string",
  "cooperative_id": "uuid-string",
  "date": "2025-12-08T00:00:00Z",
  "category": "quality|environmental|safety",
  "severity": "low|medium|high|critical",
  "description": "ISO 9001.8.5 - Production quality issue...",
  "corrective_action": "Immediate corrective steps...",
  "status": "open|in_progress|closed",
  "assigned_to": "manager@dims9.com",
  "closed_date": "2025-12-12T00:00:00Z|null",
  "created_at": "2025-12-08T10:00:00Z"
}
```

**Indexes:**
- `id` (unique)
- `cooperative_id`
- `status`
- `category`
- `severity`

**Constraints:**
- category: Enum ["quality", "environmental", "safety"]
- severity: Enum ["low", "medium", "high", "critical"]
- status: Enum ["open", "in_progress", "closed"]
- closed_date: Required when status = "closed"

### Data Relationships

```
users (1) ───> (N) cooperatives
  │                      │
  │                      │
  │                      v
  │              production_logs (N)
  │                      │
  └──────────────────v
               nonconformities (N)
```

- Users belong to cooperatives (manager/farmer)
- Production logs belong to cooperatives
- Nonconformities belong to cooperatives
- Nonconformities assigned to users (managers)

---

## API Documentation

### Base URL
```
Production: https://agri-twins.emergent.host/api
Local: http://localhost:8001/api
```

### Authentication

All endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

**Header:**
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /auth/register

Create new user account.

**Request:**
```json
{
  "email": "user@dims9.com",
  "password": "password123",
  "name": "User Name",
  "role": "farmer",
  "cooperative_id": "uuid-string" // optional for officer
}
```

**Response:**
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@dims9.com",
    "name": "User Name",
    "role": "farmer",
    "cooperative_id": "uuid",
    "created_at": "2025-12-13T10:00:00Z"
  }
}
```

#### POST /auth/login

Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@dims9.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "user": { /* user object */ }
}
```

**Errors:**
- 401: Invalid credentials

### User Management Endpoints

#### GET /users

Get all users (officers only).

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@dims9.com",
    "name": "User Name",
    "role": "manager",
    "cooperative_id": "uuid",
    "created_at": "2025-12-13T10:00:00Z"
  }
]
```

#### PUT /users/{user_id}

Update user information (officers only).

**Request:**
```json
{
  "name": "Updated Name",
  "email": "newemail@dims9.com",
  "role": "manager",
  "cooperative_id": "uuid",
  "password": "newpassword123" // optional
}
```

#### DELETE /users/{user_id}

Delete user (officers only).

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### Cooperative Endpoints

#### GET /cooperatives

Get all cooperatives.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Green Valley Coffee Cooperative",
    "country": "Ethiopia",
    "product": "Coffee",
    "status": "active",
    "created_at": "2025-12-05T14:35:19Z"
  }
]
```

#### GET /cooperatives/{cooperative_id}

Get single cooperative details.

#### GET /cooperatives/{cooperative_id}/stats

Get aggregate statistics for cooperative.

**Response:**
```json
{
  "total_production": 12500.5,
  "avg_quality_a": 88.5,
  "avg_loss": 3.2,
  "open_issues": 5,
  "total_logs": 45
}
```

### Production Log Endpoints

#### GET /production-logs

Get all production logs.

**Query Parameters:**
- `cooperative_id` (optional): Filter by cooperative

**Response:**
```json
[
  {
    "id": "uuid",
    "cooperative_id": "uuid",
    "date": "2025-12-10T00:00:00Z",
    "total_production": 500.5,
    "grade_a_percent": 85.0,
    "grade_b_percent": 12.0,
    "post_harvest_loss_percent": 3.5,
    "post_harvest_loss_kg": 17.5,
    "energy_use": "Low",
    "has_nonconformity": false,
    "created_at": "2025-12-10T08:30:00Z"
  }
]
```

#### POST /production-logs

Create new production log.

**Request:**
```json
{
  "cooperative_id": "uuid",
  "date": "2025-12-13T00:00:00Z",
  "total_production": 450.0,
  "grade_a_percent": 82.0,
  "grade_b_percent": 15.0,
  "post_harvest_loss_percent": 3.0,
  "post_harvest_loss_kg": 13.5,
  "energy_use": "Medium",
  "has_nonconformity": false
}
```

#### PUT /production-logs/{log_id}

Update existing production log.

#### DELETE /production-logs/{log_id}

Delete production log.

### Nonconformity Endpoints

#### GET /nonconformities

Get all nonconformities (issues).

**Query Parameters:**
- `cooperative_id` (optional)
- `status` (optional): open, in_progress, closed
- `category` (optional): quality, environmental, safety

**Response:**
```json
[
  {
    "id": "uuid",
    "cooperative_id": "uuid",
    "date": "2025-12-08T00:00:00Z",
    "category": "quality",
    "severity": "high",
    "description": "ISO 9001.8.5 - Quality issue...",
    "corrective_action": "Corrective steps...",
    "status": "in_progress",
    "assigned_to": "manager@dims9.com",
    "created_at": "2025-12-08T10:00:00Z"
  }
]
```

#### POST /nonconformities

Create new nonconformity.

**Request:**
```json
{
  "cooperative_id": "uuid",
  "date": "2025-12-13T00:00:00Z",
  "category": "quality",
  "severity": "medium",
  "description": "Detailed description with ISO clause",
  "corrective_action": "Action plan",
  "status": "open",
  "assigned_to": "manager@dims9.com"
}
```

#### PUT /nonconformities/{nc_id}

Update nonconformity (full update).

#### PATCH /nonconformities/{nc_id}

Partial update (status change).

**Request:**
```json
{
  "status": "closed"
}
```

### Admin Endpoints

#### POST /reinit-data

Reinitialize database with sample data (officers only).

**Response:**
```json
{
  "message": "Database reinitialized successfully",
  "cooperatives_created": 4,
  "production_logs_created": 40,
  "nonconformities_created": 33
}
```

#### POST /fix-manager-cooperative

Fix manager cooperative assignment (officers only).

#### POST /update-manager-cooperative

Update manager to specific cooperative (officers only).

**Query Parameters:**
- `cooperative_id`: Target cooperative UUID

#### POST /update-email-domains

Bulk update email domains (officers only).

**Query Parameters:**
- `old_domain`: Current domain (e.g., "dims.com")
- `new_domain`: New domain (e.g., "dims9.com")

---

## Frontend Architecture

### Project Structure

```
/app/frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn UI components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dialog.jsx
│   │   │   └── ...
│   │   └── ISOLogo.jsx     # Custom component
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── CooperativeOverview.jsx    # Officer
│   │   ├── Dashboard.jsx              # Shared
│   │   ├── ManagerHome.jsx            # Manager
│   │   ├── FarmerHome.jsx             # Farmer
│   │   ├── FarmerCommunity.jsx        # Farmer
│   │   ├── DataEntry.jsx              # Manager/Farmer
│   │   ├── DataEntriesView.jsx        # Shared
│   │   ├── IssuesManagement.jsx       # Shared
│   │   ├── ISOCompliance.jsx          # Shared
│   │   ├── WhatIfSimulator.jsx        # Manager
│   │   ├── AdminTools.jsx             # Officer
│   │   └── UserManagement.jsx         # Officer
│   ├── App.js           # Main app with routing
│   ├── App.css
│   └── index.js
├── package.json
├── tailwind.config.js
└── .env              # Environment variables
```

### Routing Structure

```javascript
// App.js routing configuration

// Public routes
/login              → Login page

// Officer routes
/overview           → CooperativeOverview
/admin-tools        → AdminTools

// Manager routes
/home               → ManagerHome
/data-entry         → DataEntry

// Farmer routes
/farmer-home        → FarmerHome
/farmer-community   → FarmerCommunity

// Shared routes (authenticated)
/dashboard          → Dashboard
/issues             → IssuesManagement
/data-entries       → DataEntriesView
/iso-compliance     → ISOCompliance
/simulator          → WhatIfSimulator
```

### State Management

#### Global State
- **user**: Current authenticated user object
- **token**: JWT authentication token (localStorage)

#### Component State (useState)
- Loading states
- Form data
- API response data
- UI state (dialogs, filters)

#### Data Fetching Pattern
```javascript
useEffect(() => {
  const loadData = async () => {
    try {
      const response = await api.get('/endpoint');
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
    setLoading(false);
  };
  loadData();
}, []);
```

### API Client Configuration

```javascript
// Axios instance with interceptors
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Component Patterns

#### Page Component Structure
```javascript
const PageName = ({ user, setUser, api }) => {
  // State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Effects
  useEffect(() => {
    loadData();
  }, []);
  
  // Handlers
  const loadData = async () => { /* ... */ };
  const handleAction = () => { /* ... */ };
  
  // Render
  if (loading) return <LoadingState />;
  
  return (
    <div>
      <Header />
      <Main>
        {/* Content */}
      </Main>
    </div>
  );
};
```

### Styling Approach

**TailwindCSS Utility Classes:**
- Layout: `flex`, `grid`, `space-y-6`
- Spacing: `p-4`, `m-2`, `gap-4`
- Colors: `bg-green-500`, `text-gray-900`
- Responsive: `sm:text-lg`, `md:grid-cols-2`
- Effects: `shadow-lg`, `hover:bg-green-700`

**Component Library (Shadcn UI):**
- Pre-styled, accessible components
- Customizable with TailwindCSS
- Consistent design system

---

## Security Implementation

### Authentication Flow

1. **User Login:**
   - User submits email/password
   - Backend validates credentials
   - Backend generates JWT token
   - Frontend stores token in localStorage
   - Frontend includes token in all requests

2. **Token Structure:**
```json
{
  "sub": "user_id",
  "email": "user@dims9.com",
  "exp": 1734529113  // Expiration timestamp
}
```

3. **Token Validation:**
   - Every protected endpoint validates JWT
   - Checks expiration
   - Verifies signature
   - Extracts user information

### Password Security

**Hashing Algorithm:** bcrypt with salt

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("plain_password")

# Verify password
is_valid = pwd_context.verify("plain_password", hashed)
```

### Role-Based Access Control (RBAC)

**Implementation:**
```python
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user = db.users.find_one({"id": payload["sub"]})
    return user

@app.get("/admin-only")
def admin_endpoint(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Forbidden")
    # ... admin logic
```

**Access Matrix:**

| Resource | Officer | Manager | Farmer |
|----------|---------|---------|--------|
| All cooperatives | ✓ | ✗ | ✗ |
| Own cooperative | ✓ | ✓ | ✓ |
| Create users | ✓ | ✗ | ✗ |
| Edit all issues | ✓ | ✗ | ✗ |
| Edit own coop issues | ✓ | ✓ | ✗ |
| Log production | ✓ | ✓ | ✓ |
| View community | ✗ | ✗ | ✓ |

### Input Validation

**Backend (Pydantic):**
```python
class ProductionLogCreate(BaseModel):
    cooperative_id: str
    date: datetime
    total_production: float = Field(gt=0)  # Must be positive
    grade_a_percent: float = Field(ge=0, le=100)  # 0-100
    # ...
```

**Frontend:**
- HTML5 validation (required, type="email", min, max)
- Client-side checks before submission
- User-friendly error messages

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production:** Restrict to specific domains

---

## Deployment Guide

### Environment Configuration

#### Backend (.env)
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="dims_database"
CORS_ORIGINS="*"
JWT_SECRET_KEY="your-secret-key-change-in-production"
```

#### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=https://agri-twins.emergent.host
```

### Production Deployment

#### Backend Deployment

1. **Install Dependencies:**
```bash
cd /app/backend
pip install -r requirements.txt
```

2. **Run with Uvicorn:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8001
```

3. **Process Manager (Supervisor):**
```ini
[program:backend]
command=uvicorn server:app --host 0.0.0.0 --port 8001
directory=/app/backend
autostart=true
autorestart=true
```

#### Frontend Deployment

1. **Install Dependencies:**
```bash
cd /app/frontend
yarn install
```

2. **Build for Production:**
```bash
yarn build
```

3. **Serve with Process Manager:**
```ini
[program:frontend]
command=yarn start
directory=/app/frontend
autostart=true
autorestart=true
```

#### Database Setup

1. **Install MongoDB:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

2. **Initialize Data:**
```bash
# API endpoint to create sample data
curl -X POST https://your-domain.com/api/reinit-data \
  -H "Authorization: Bearer $OFFICER_TOKEN"
```

### Monitoring & Logs

**Backend Logs:**
```bash
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log
```

**Frontend Logs:**
```bash
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/frontend.out.log
```

---

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- Git

### Local Development

#### 1. Clone Repository
```bash
git clone <repository-url>
cd dims-application
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo 'MONGO_URL="mongodb://localhost:27017"' > .env
echo 'DB_NAME="dims_database"' >> .env
echo 'JWT_SECRET_KEY="dev-secret-key"' >> .env

# Run server
uvicorn server:app --reload --port 8001
```

#### 3. Frontend Setup
```bash
cd frontend
yarn install

# Create .env file
echo 'REACT_APP_BACKEND_URL=http://localhost:8001' > .env

# Run development server
yarn start
```

#### 4. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

### Development Workflow

1. **Create Feature Branch:**
```bash
git checkout -b feature/new-feature
```

2. **Make Changes:**
- Write code
- Test locally
- Run linters

3. **Lint Code:**
```bash
# Backend
cd backend
ruff check .

# Frontend
cd frontend
npm run lint
```

4. **Commit and Push:**
```bash
git add .
git commit -m "Add new feature"
git push origin feature/new-feature
```

### Testing

#### Manual Testing
1. Create test users for each role
2. Test key workflows
3. Verify data persistence
4. Check error handling

#### API Testing (curl)
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"officer@dims9.com","password":"officer123"}' \
  | jq -r '.access_token')

# Get cooperatives
curl -X GET http://localhost:8001/api/cooperatives \
  -H "Authorization: Bearer $TOKEN"
```

---

## Performance Optimization

### Backend Optimizations
1. **Database Indexes:** Ensure indexes on frequently queried fields
2. **Async Operations:** Use Motor for non-blocking MongoDB operations
3. **Caching:** Implement Redis caching for frequent queries (future)
4. **Pagination:** Add limit/offset to large result sets (future)

### Frontend Optimizations
1. **Code Splitting:** React.lazy for route-based code splitting
2. **Image Optimization:** Compress and lazy-load images
3. **Bundle Size:** Analyze and reduce bundle size
4. **Memoization:** Use React.memo for expensive components

---

## Troubleshooting

### Common Issues

**Issue:** CORS errors in browser
- **Solution:** Verify CORS_ORIGINS in backend .env
- **Solution:** Ensure frontend URL is allowed

**Issue:** JWT token expired
- **Solution:** Implement token refresh logic
- **Solution:** Increase token expiration time

**Issue:** MongoDB connection failed
- **Solution:** Check MongoDB is running
- **Solution:** Verify MONGO_URL in .env

**Issue:** Hot reload not working
- **Solution:** Restart supervisor
- **Solution:** Check file watcher limits

---

## Appendix

### Useful Commands

```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# View service status
sudo supervisorctl status

# MongoDB shell
mongo dims_database

# View collections
show collections
db.users.find()

# Install new Python package
pip install package-name
pip freeze > requirements.txt

# Install new Node package
cd frontend
yarn add package-name
```

### Resources

- **FastAPI:** https://fastapi.tiangolo.com
- **React:** https://react.dev
- **MongoDB:** https://docs.mongodb.com
- **TailwindCSS:** https://tailwindcss.com
- **Shadcn UI:** https://ui.shadcn.com

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** Development Team
