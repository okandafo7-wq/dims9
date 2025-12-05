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
from jwt.exceptions import ExpiredSignatureError, PyJWTError
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

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str  # "manager" or "officer"
    cooperative_id: Optional[str] = None  # Only for managers
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    cooperative_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class Cooperative(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    country: str
    product: str
    status: str  # "active", "pending", "inactive"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductionLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cooperative_id: str
    date: datetime
    batch_period: str
    total_production: float  # kg or liters
    grade_a_percent: float
    grade_b_percent: float
    post_harvest_loss_percent: float
    post_harvest_loss_kg: float
    energy_use: str  # "Low", "Medium", "High"
    has_nonconformity: bool
    nonconformity_description: Optional[str] = None
    corrective_action: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Nonconformity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cooperative_id: str
    production_log_id: Optional[str] = None
    date: datetime
    category: str  # "quality", "safety", "environmental"
    severity: str  # "low", "medium", "high"
    description: str
    corrective_action: str
    status: str  # "open", "in_progress", "closed"
    closed_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScenarioRequest(BaseModel):
    cooperative_id: str
    current_loss_percent: float
    target_loss_percent: float
    price_per_kg: float
    avg_production_kg: float

class ScenarioResponse(BaseModel):
    current_sellable_kg: float
    target_sellable_kg: float
    additional_sellable_kg: float
    current_revenue: float
    target_revenue: float
    revenue_gain: float
    explanation: str

# ============= HELPER FUNCTIONS =============

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
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ============= AUTHENTICATION ROUTES =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        cooperative_id=user_data.cooperative_id
    )
    
    user_doc = user.model_dump()
    user_doc['timestamp'] = user_doc['created_at'].isoformat()
    user_doc['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_doc)
    
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

# ============= COOPERATIVE ROUTES =============

@api_router.get("/cooperatives", response_model=List[Cooperative])
async def get_cooperatives(current_user: dict = Depends(get_current_user)):
    cooperatives = await db.cooperatives.find({}, {"_id": 0}).to_list(1000)
    for coop in cooperatives:
        if isinstance(coop.get('created_at'), str):
            coop['created_at'] = datetime.fromisoformat(coop['created_at'])
    return cooperatives

@api_router.get("/cooperatives/{coop_id}", response_model=Cooperative)
async def get_cooperative(coop_id: str, current_user: dict = Depends(get_current_user)):
    coop = await db.cooperatives.find_one({"id": coop_id}, {"_id": 0})
    if not coop:
        raise HTTPException(status_code=404, detail="Cooperative not found")
    if isinstance(coop.get('created_at'), str):
        coop['created_at'] = datetime.fromisoformat(coop['created_at'])
    return Cooperative(**coop)

@api_router.post("/cooperatives", response_model=Cooperative)
async def create_cooperative(coop: Cooperative, current_user: dict = Depends(get_current_user)):
    coop_doc = coop.model_dump()
    coop_doc['created_at'] = coop_doc['created_at'].isoformat()
    await db.cooperatives.insert_one(coop_doc)
    return coop

# ============= PRODUCTION LOG ROUTES =============

@api_router.get("/production-logs", response_model=List[ProductionLog])
async def get_production_logs(
    cooperative_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if current_user['role'] == 'manager' and current_user.get('cooperative_id'):
        query['cooperative_id'] = current_user['cooperative_id']
    elif cooperative_id:
        query['cooperative_id'] = cooperative_id
    
    logs = await db.production_logs.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for log in logs:
        if isinstance(log.get('date'), str):
            log['date'] = datetime.fromisoformat(log['date'])
        if isinstance(log.get('created_at'), str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])
    return logs

@api_router.post("/production-logs", response_model=ProductionLog)
async def create_production_log(log: ProductionLog, current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'manager':
        if not current_user.get('cooperative_id') or log.cooperative_id != current_user['cooperative_id']:
            raise HTTPException(status_code=403, detail="Cannot create log for other cooperatives")
    
    log_doc = log.model_dump()
    log_doc['date'] = log_doc['date'].isoformat()
    log_doc['created_at'] = log_doc['created_at'].isoformat()
    
    await db.production_logs.insert_one(log_doc)
    
    # If has nonconformity, create a nonconformity record
    if log.has_nonconformity and log.nonconformity_description:
        nonconformity = Nonconformity(
            cooperative_id=log.cooperative_id,
            production_log_id=log.id,
            date=log.date,
            category="quality",
            severity="medium",
            description=log.nonconformity_description,
            corrective_action=log.corrective_action or "Pending",
            status="open"
        )
        nc_doc = nonconformity.model_dump()
        nc_doc['date'] = nc_doc['date'].isoformat()
        nc_doc['created_at'] = nc_doc['created_at'].isoformat()
        await db.nonconformities.insert_one(nc_doc)
    
    return log

# ============= NONCONFORMITY ROUTES =============

@api_router.get("/nonconformities", response_model=List[Nonconformity])
async def get_nonconformities(
    cooperative_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if current_user['role'] == 'manager' and current_user.get('cooperative_id'):
        query['cooperative_id'] = current_user['cooperative_id']
    elif cooperative_id:
        query['cooperative_id'] = cooperative_id
    
    if status:
        query['status'] = status
    
    ncs = await db.nonconformities.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for nc in ncs:
        if isinstance(nc.get('date'), str):
            nc['date'] = datetime.fromisoformat(nc['date'])
        if isinstance(nc.get('created_at'), str):
            nc['created_at'] = datetime.fromisoformat(nc['created_at'])
        if nc.get('closed_date') and isinstance(nc['closed_date'], str):
            nc['closed_date'] = datetime.fromisoformat(nc['closed_date'])
    return ncs

@api_router.patch("/nonconformities/{nc_id}")
async def update_nonconformity(
    nc_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    update_data = {"status": status}
    if status == "closed":
        update_data["closed_date"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.nonconformities.update_one(
        {"id": nc_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nonconformity not found")
    
    return {"message": "Updated successfully"}

# ============= KPI & STATS ROUTES =============

@api_router.get("/kpis/cooperative/{coop_id}")
async def get_cooperative_kpis(coop_id: str, current_user: dict = Depends(get_current_user)):
    # Get recent production logs
    logs = await db.production_logs.find(
        {"cooperative_id": coop_id},
        {"_id": 0}
    ).sort("date", -1).limit(10).to_list(10)
    
    if not logs:
        return {
            "cooperative_id": coop_id,
            "total_production_last_week": 0,
            "avg_loss_percent": 0,
            "open_issues": 0,
            "avg_quality_a": 0
        }
    
    total_production = sum(log['total_production'] for log in logs)
    avg_loss = sum(log['post_harvest_loss_percent'] for log in logs) / len(logs)
    avg_quality_a = sum(log['grade_a_percent'] for log in logs) / len(logs)
    
    # Count open nonconformities
    open_issues = await db.nonconformities.count_documents({
        "cooperative_id": coop_id,
        "status": {"$in": ["open", "in_progress"]}
    })
    
    return {
        "cooperative_id": coop_id,
        "total_production_last_week": total_production,
        "avg_loss_percent": round(avg_loss, 2),
        "open_issues": open_issues,
        "avg_quality_a": round(avg_quality_a, 2)
    }

@api_router.get("/kpis/overview")
async def get_overview_kpis(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can view overview")
    
    cooperatives = await db.cooperatives.find({}, {"_id": 0}).to_list(1000)
    
    overview = []
    for coop in cooperatives:
        kpis = await get_cooperative_kpis(coop['id'], current_user)
        overview.append({
            "cooperative": coop,
            "kpis": kpis
        })
    
    return overview

# ============= SCENARIO / WHAT-IF SIMULATOR =============

@api_router.post("/scenario/loss-reduction", response_model=ScenarioResponse)
async def calculate_loss_reduction_scenario(
    scenario: ScenarioRequest,
    current_user: dict = Depends(get_current_user)
):
    # Calculate current sellable quantity
    current_loss_kg = scenario.avg_production_kg * (scenario.current_loss_percent / 100)
    current_sellable_kg = scenario.avg_production_kg - current_loss_kg
    current_revenue = current_sellable_kg * scenario.price_per_kg
    
    # Calculate target sellable quantity
    target_loss_kg = scenario.avg_production_kg * (scenario.target_loss_percent / 100)
    target_sellable_kg = scenario.avg_production_kg - target_loss_kg
    target_revenue = target_sellable_kg * scenario.price_per_kg
    
    # Calculate gains
    additional_sellable_kg = target_sellable_kg - current_sellable_kg
    revenue_gain = target_revenue - current_revenue
    
    explanation = (
        f"By reducing post-harvest loss from {scenario.current_loss_percent}% to {scenario.target_loss_percent}%, "
        f"you can save an additional {additional_sellable_kg:.2f} kg of product. "
        f"This translates to a revenue increase of €{revenue_gain:.2f}, "
        f"bringing your total revenue from €{current_revenue:.2f} to €{target_revenue:.2f}."
    )
    
    return ScenarioResponse(
        current_sellable_kg=round(current_sellable_kg, 2),
        target_sellable_kg=round(target_sellable_kg, 2),
        additional_sellable_kg=round(additional_sellable_kg, 2),
        current_revenue=round(current_revenue, 2),
        target_revenue=round(target_revenue, 2),
        revenue_gain=round(revenue_gain, 2),
        explanation=explanation
    )

# ============= INITIALIZE SAMPLE DATA =============

@api_router.post("/init-mvp-data")
async def initialize_mvp_data(current_user: dict = Depends(get_current_user)):
    # Check if data already exists
    existing_coops = await db.cooperatives.count_documents({})
    if existing_coops > 0:
        return {"message": "MVP data already initialized"}
    
    # Create 2 cooperatives
    cooperatives = [
        {
            "id": str(uuid.uuid4()),
            "name": "Green Valley Coffee Cooperative",
            "country": "Ethiopia",
            "product": "Coffee",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mediterranean Olive Oil Cooperative",
            "country": "Tunisia",
            "product": "Olive Oil",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.cooperatives.insert_many(cooperatives)
    
    # Create sample production logs for each cooperative
    for coop in cooperatives:
        for i in range(10):
            date = datetime.now(timezone.utc) - timedelta(days=i*3)
            log = {
                "id": str(uuid.uuid4()),
                "cooperative_id": coop['id'],
                "date": date.isoformat(),
                "batch_period": f"Week {10-i}",
                "total_production": 500 + (i * 30),
                "grade_a_percent": 75 - (i % 5),
                "grade_b_percent": 25 + (i % 5),
                "post_harvest_loss_percent": 12 + (i % 3),
                "post_harvest_loss_kg": (500 + (i * 30)) * (12 + (i % 3)) / 100,
                "energy_use": ["Low", "Medium", "High"][i % 3],
                "has_nonconformity": i % 4 == 0,
                "nonconformity_description": "Quality issues with batch" if i % 4 == 0 else None,
                "corrective_action": "Improved sorting process" if i % 4 == 0 else None,
                "created_at": date.isoformat()
            }
            await db.production_logs.insert_one(log)
            
            # Create nonconformities for some logs
            if i % 4 == 0:
                nc_descriptions = [
                    ("quality", "Quality issues with batch - uneven size distribution", "Improved sorting process and training for workers"),
                    ("safety", "Worker safety concern - inadequate protective equipment", "Provided new safety gear and conducted safety training"),
                    ("environmental", "Excessive water usage detected during processing", "Installed water-efficient equipment and monitoring system"),
                    ("quality", "Contamination risk identified in storage area", "Deep cleaned storage facility and implemented regular inspection"),
                    ("safety", "Unsafe handling of heavy equipment reported", "Updated safety protocols and conducted equipment training"),
                    ("environmental", "Waste disposal not following best practices", "Implemented proper waste segregation and disposal system"),
                    ("quality", "Moisture content exceeds acceptable limits", "Adjusted drying process and added quality checkpoints"),
                    ("safety", "Inadequate ventilation in processing area", "Installed ventilation fans and air quality monitors"),
                    ("environmental", "Pesticide residue above threshold levels", "Switched to organic pest control methods"),
                    ("quality", "Packaging materials not meeting standards", "Sourced new supplier with certified materials")
                ]
                
                nc_info = nc_descriptions[i % len(nc_descriptions)]
                nc = {
                    "id": str(uuid.uuid4()),
                    "cooperative_id": coop['id'],
                    "production_log_id": log['id'],
                    "date": date.isoformat(),
                    "category": nc_info[0],
                    "severity": ["low", "medium", "high", "medium"][i % 4],
                    "description": nc_info[1],
                    "corrective_action": nc_info[2],
                    "status": "open" if i < 4 else ("in_progress" if i < 6 else "closed"),
                    "closed_date": (date + timedelta(days=5)).isoformat() if i >= 6 else None,
                    "created_at": date.isoformat()
                }
                await db.nonconformities.insert_one(nc)
    
    return {"message": "MVP sample data initialized successfully", "cooperatives": len(cooperatives)}

# ============= SETUP =============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()