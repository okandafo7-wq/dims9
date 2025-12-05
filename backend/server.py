from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dims-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "farmer"  # farmer, admin
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "farmer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class FarmMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    farm_name: str
    location: str
    area_hectares: float
    crop_type: str
    growth_stage: str
    health_status: str
    temperature: float
    humidity: float
    soil_moisture: float
    predicted_yield: float
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ESGMetrics(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    period: str  # e.g., "2024-Q1"
    # Environmental
    water_usage: float  # liters
    carbon_footprint: float  # kg CO2
    waste_reduced: float  # kg
    renewable_energy: float  # percentage
    # Social
    women_employed: int
    training_hours: float
    income_growth: float  # percentage
    # Governance
    iso9001_score: float  # 0-100
    iso14001_score: float  # 0-100
    iso45001_score: float  # 0-100
    audit_compliance: float  # percentage
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Unauthorized")

# Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    user_doc = user.model_dump()
    user_doc['timestamp'] = user_doc['created_at'].isoformat()
    user_doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert timestamp back to datetime
    if isinstance(user.get('timestamp'), str):
        user['created_at'] = datetime.fromisoformat(user['timestamp'])
    
    user_obj = User(**user)
    access_token = create_access_token(data={"sub": user['id'], "email": user['email']})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_obj
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user.get('timestamp'), str):
        current_user['created_at'] = datetime.fromisoformat(current_user['timestamp'])
    return User(**current_user)

# Digital Twin Routes
@api_router.get("/farms", response_model=List[FarmMetrics])
async def get_farms(current_user: dict = Depends(get_current_user)):
    farms = await db.farms.find({}, {"_id": 0}).to_list(1000)
    for farm in farms:
        if isinstance(farm.get('last_updated'), str):
            farm['last_updated'] = datetime.fromisoformat(farm['last_updated'])
    return farms

@api_router.get("/farms/{farm_id}", response_model=FarmMetrics)
async def get_farm(farm_id: str, current_user: dict = Depends(get_current_user)):
    farm = await db.farms.find_one({"id": farm_id}, {"_id": 0})
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if isinstance(farm.get('last_updated'), str):
        farm['last_updated'] = datetime.fromisoformat(farm['last_updated'])
    return FarmMetrics(**farm)

@api_router.post("/farms", response_model=FarmMetrics)
async def create_farm(farm: FarmMetrics, current_user: dict = Depends(get_current_user)):
    farm_doc = farm.model_dump()
    farm_doc['last_updated'] = farm_doc['last_updated'].isoformat()
    await db.farms.insert_one(farm_doc)
    return farm

# ESG Routes
@api_router.get("/esg", response_model=List[ESGMetrics])
async def get_esg_metrics(current_user: dict = Depends(get_current_user)):
    metrics = await db.esg_metrics.find({}, {"_id": 0}).to_list(1000)
    for metric in metrics:
        if isinstance(metric.get('timestamp'), str):
            metric['timestamp'] = datetime.fromisoformat(metric['timestamp'])
    return metrics

@api_router.post("/esg", response_model=ESGMetrics)
async def create_esg_metric(metric: ESGMetrics, current_user: dict = Depends(get_current_user)):
    metric_doc = metric.model_dump()
    metric_doc['timestamp'] = metric_doc['timestamp'].isoformat()
    await db.esg_metrics.insert_one(metric_doc)
    return metric

# Initialize dummy data
@api_router.post("/init-data")
async def initialize_data(current_user: dict = Depends(get_current_user)):
    # Check if data already exists
    existing_farms = await db.farms.count_documents({})
    if existing_farms > 0:
        return {"message": "Data already initialized"}
    
    # Create sample farms
    farms = [
        {
            "id": str(uuid.uuid4()),
            "farm_name": "Green Valley Cooperative",
            "location": "Punjab, India",
            "area_hectares": 45.5,
            "crop_type": "Wheat",
            "growth_stage": "Flowering",
            "health_status": "Excellent",
            "temperature": 24.5,
            "humidity": 65.0,
            "soil_moisture": 72.0,
            "predicted_yield": 4500.0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "farm_name": "Sunrise Women's Farm",
            "location": "Karnataka, India",
            "area_hectares": 32.0,
            "crop_type": "Rice",
            "growth_stage": "Vegetative",
            "health_status": "Good",
            "temperature": 28.0,
            "humidity": 78.0,
            "soil_moisture": 85.0,
            "predicted_yield": 3200.0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "farm_name": "Harmony Agriculture Hub",
            "location": "Maharashtra, India",
            "area_hectares": 28.5,
            "crop_type": "Cotton",
            "growth_stage": "Maturity",
            "health_status": "Fair",
            "temperature": 32.0,
            "humidity": 55.0,
            "soil_moisture": 60.0,
            "predicted_yield": 2850.0,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.farms.insert_many(farms)
    
    # Create sample ESG metrics
    esg_data = [
        {
            "id": str(uuid.uuid4()),
            "period": "2024-Q1",
            "water_usage": 125000,
            "carbon_footprint": 850,
            "waste_reduced": 320,
            "renewable_energy": 35.0,
            "women_employed": 48,
            "training_hours": 156.0,
            "income_growth": 18.5,
            "iso9001_score": 87.0,
            "iso14001_score": 82.0,
            "iso45001_score": 90.0,
            "audit_compliance": 94.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "period": "2024-Q2",
            "water_usage": 118000,
            "carbon_footprint": 780,
            "waste_reduced": 385,
            "renewable_energy": 42.0,
            "women_employed": 52,
            "training_hours": 178.0,
            "income_growth": 22.0,
            "iso9001_score": 89.0,
            "iso14001_score": 85.0,
            "iso45001_score": 92.0,
            "audit_compliance": 96.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "period": "2024-Q3",
            "water_usage": 112000,
            "carbon_footprint": 720,
            "waste_reduced": 425,
            "renewable_energy": 48.0,
            "women_employed": 58,
            "training_hours": 192.0,
            "income_growth": 25.5,
            "iso9001_score": 91.0,
            "iso14001_score": 88.0,
            "iso45001_score": 93.0,
            "audit_compliance": 97.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.esg_metrics.insert_many(esg_data)
    
    return {"message": "Sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()