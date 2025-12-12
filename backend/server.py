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
    severity: str  # "low", "medium", "high", "critical"
    description: str
    corrective_action: str
    status: str  # "open", "in_progress", "closed"
    assigned_to: Optional[str] = None  # user email
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

# ============= USER MANAGEMENT ROUTES =============

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users (officer only)"""
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can view all users")
    
    users = await db.users.find({}, {"_id": 0, "password": 0, "hashed_password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('timestamp'), str):
            user['created_at'] = datetime.fromisoformat(user['timestamp'])
        elif not user.get('created_at'):
            user['created_at'] = datetime.now(timezone.utc)
    return users

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a user (officer only)"""
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can update users")
    
    update_data = {}
    if 'name' in user_data:
        update_data['name'] = user_data['name']
    if 'email' in user_data:
        # Check if email already exists for a different user
        existing = await db.users.find_one({"email": user_data['email'], "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data['email'] = user_data['email']
    if 'role' in user_data:
        update_data['role'] = user_data['role']
    if 'cooperative_id' in user_data:
        update_data['cooperative_id'] = user_data['cooperative_id'] if user_data['cooperative_id'] else None
    if 'password' in user_data and user_data['password']:
        update_data['password'] = hash_password(user_data['password'])
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch and return updated user
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0, "hashed_password": 0})
    if isinstance(updated_user.get('timestamp'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['timestamp'])
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a user (officer only)"""
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can delete users")
    
    # Prevent deleting self
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

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

@api_router.put("/production-logs/{log_id}", response_model=ProductionLog)
async def update_production_log(
    log_id: str,
    log_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a production log"""
    # Get existing log
    existing_log = await db.production_logs.find_one({"id": log_id}, {"_id": 0})
    if not existing_log:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    # Check permissions
    if current_user['role'] == 'manager':
        if existing_log['cooperative_id'] != current_user.get('cooperative_id'):
            raise HTTPException(status_code=403, detail="Cannot update log for other cooperatives")
    
    # Update fields
    update_data = {}
    allowed_fields = [
        'total_production', 'grade_a_percent', 'grade_b_percent',
        'post_harvest_loss_percent', 'post_harvest_loss_kg', 'energy_use',
        'has_nonconformity', 'nonconformity_description', 'corrective_action'
    ]
    
    for field in allowed_fields:
        if field in log_data:
            update_data[field] = log_data[field]
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.production_logs.update_one(
        {"id": log_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Production log not found or no changes")
    
    # Fetch and return updated log
    updated_log = await db.production_logs.find_one({"id": log_id}, {"_id": 0})
    if isinstance(updated_log.get('date'), str):
        updated_log['date'] = datetime.fromisoformat(updated_log['date'])
    if isinstance(updated_log.get('created_at'), str):
        updated_log['created_at'] = datetime.fromisoformat(updated_log['created_at'])
    
    return ProductionLog(**updated_log)

@api_router.delete("/production-logs/{log_id}")
async def delete_production_log(
    log_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a production log"""
    # Get existing log
    existing_log = await db.production_logs.find_one({"id": log_id}, {"_id": 0})
    if not existing_log:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    # Check permissions
    if current_user['role'] == 'manager':
        if existing_log['cooperative_id'] != current_user.get('cooperative_id'):
            raise HTTPException(status_code=403, detail="Cannot delete log for other cooperatives")
    
    result = await db.production_logs.delete_one({"id": log_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Production log not found")
    
    return {"message": "Production log deleted successfully"}

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

class NonconformityCreate(BaseModel):
    cooperative_id: str
    date: datetime
    category: str
    severity: str
    description: str
    corrective_action: str
    status: str = "open"
    assigned_to: Optional[str] = None

class NonconformityUpdate(BaseModel):
    category: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    corrective_action: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None

@api_router.post("/nonconformities", response_model=Nonconformity)
async def create_nonconformity(
    nc_data: NonconformityCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new nonconformity/issue"""
    nc = Nonconformity(
        id=str(uuid.uuid4()),
        cooperative_id=nc_data.cooperative_id,
        date=nc_data.date,
        category=nc_data.category,
        severity=nc_data.severity,
        description=nc_data.description,
        corrective_action=nc_data.corrective_action,
        status=nc_data.status,
        assigned_to=nc_data.assigned_to,
        created_at=datetime.now(timezone.utc)
    )
    
    nc_doc = nc.model_dump()
    nc_doc['date'] = nc_doc['date'].isoformat()
    nc_doc['created_at'] = nc_doc['created_at'].isoformat()
    
    await db.nonconformities.insert_one(nc_doc)
    
    return nc

@api_router.put("/nonconformities/{nc_id}", response_model=Nonconformity)
async def update_nonconformity_full(
    nc_id: str,
    nc_data: NonconformityUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Fully update a nonconformity/issue"""
    update_data = {}
    
    if nc_data.category is not None:
        update_data["category"] = nc_data.category
    if nc_data.severity is not None:
        update_data["severity"] = nc_data.severity
    if nc_data.description is not None:
        update_data["description"] = nc_data.description
    if nc_data.corrective_action is not None:
        update_data["corrective_action"] = nc_data.corrective_action
    if nc_data.status is not None:
        update_data["status"] = nc_data.status
        if nc_data.status == "closed":
            update_data["closed_date"] = datetime.now(timezone.utc).isoformat()
        elif nc_data.status in ["open", "in_progress"]:
            update_data["closed_date"] = None
    if nc_data.assigned_to is not None:
        update_data["assigned_to"] = nc_data.assigned_to
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.nonconformities.update_one(
        {"id": nc_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Nonconformity not found or no changes")
    
    # Fetch and return the updated document
    updated_nc = await db.nonconformities.find_one({"id": nc_id}, {"_id": 0})
    if not updated_nc:
        raise HTTPException(status_code=404, detail="Nonconformity not found")
    
    # Convert date fields
    if isinstance(updated_nc.get('date'), str):
        updated_nc['date'] = datetime.fromisoformat(updated_nc['date'])
    if isinstance(updated_nc.get('created_at'), str):
        updated_nc['created_at'] = datetime.fromisoformat(updated_nc['created_at'])
    if updated_nc.get('closed_date') and isinstance(updated_nc['closed_date'], str):
        updated_nc['closed_date'] = datetime.fromisoformat(updated_nc['closed_date'])
    
    return Nonconformity(**updated_nc)

@api_router.patch("/nonconformities/{nc_id}")
async def update_nonconformity(
    nc_id: str,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    
    if status:
        update_data["status"] = status
        if status == "closed":
            update_data["closed_date"] = datetime.now(timezone.utc).isoformat()
        elif status == "open":  # reopening
            update_data["closed_date"] = None
    
    if assigned_to is not None:
        update_data["assigned_to"] = assigned_to
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
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
    
    return await create_sample_data()

@api_router.post("/reinit-data")
async def reinitialize_data(current_user: dict = Depends(get_current_user)):
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can reinitialize data")
    
    # Clear existing data
    await db.cooperatives.delete_many({})
    await db.production_logs.delete_many({})
    await db.nonconformities.delete_many({})
    
    return await create_sample_data()

@api_router.post("/fix-manager-cooperative")
async def fix_manager_cooperative(current_user: dict = Depends(get_current_user)):
    """Fix manager's cooperative_id to point to the first cooperative"""
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can run this fix")
    
    # Get first cooperative
    first_coop = await db.cooperatives.find_one({}, {"_id": 0})
    if not first_coop:
        raise HTTPException(status_code=404, detail="No cooperatives found")
    
    # Update manager's cooperative_id
    result = await db.users.update_one(
        {"email": "manager@dims.com"},
        {"$set": {"cooperative_id": first_coop['id']}}
    )
    
    return {
        "message": "Manager cooperative_id fixed",
        "cooperative_id": first_coop['id'],
        "cooperative_name": first_coop['name'],
        "updated": result.modified_count > 0
    }

@api_router.post("/update-manager-cooperative")
async def update_manager_cooperative(
    cooperative_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Update manager's cooperative_id to a specific cooperative"""
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can update manager cooperative")
    
    # Verify cooperative exists
    coop = await db.cooperatives.find_one({"id": cooperative_id}, {"_id": 0})
    if not coop:
        raise HTTPException(status_code=404, detail="Cooperative not found")
    
    # Update manager's cooperative_id (supports both @dims.com and @dims9.com)
    result = await db.users.update_one(
        {"email": {"$in": ["manager@dims.com", "manager@dims9.com"]}},
        {"$set": {"cooperative_id": cooperative_id}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Manager not found")
    
    return {
        "message": "Manager cooperative updated successfully",
        "cooperative_id": cooperative_id,
        "cooperative_name": coop['name']
    }

@api_router.post("/update-email-domains")
async def update_email_domains(
    old_domain: str,
    new_domain: str,
    current_user: dict = Depends(get_current_user)
):
    """Update all user email domains"""
    if current_user['role'] != 'officer':
        raise HTTPException(status_code=403, detail="Only officers can update email domains")
    
    # Get all users
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    updated_count = 0
    for user in users:
        if user['email'].endswith(f"@{old_domain}"):
            new_email = user['email'].replace(f"@{old_domain}", f"@{new_domain}")
            await db.users.update_one(
                {"id": user['id']},
                {"$set": {"email": new_email}}
            )
            updated_count += 1
    
    return {
        "message": f"Updated {updated_count} user email domains",
        "old_domain": old_domain,
        "new_domain": new_domain,
        "updated_count": updated_count
    }

async def create_sample_data():
    
    # Create 4 cooperatives with diverse data
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
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Himalayan Tea Women's Collective",
            "country": "Nepal",
            "product": "Tea",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Andean Quinoa Farmers Alliance",
            "country": "Peru",
            "product": "Quinoa",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.cooperatives.insert_many(cooperatives)
    
    # Create sample production logs for each cooperative with varying patterns
    coop_variations = [
        {"base_prod": 500, "loss_range": (10, 15), "quality_range": (70, 80)},  # Coffee - good quality
        {"base_prod": 450, "loss_range": (12, 18), "quality_range": (65, 75)},  # Olive Oil - medium
        {"base_prod": 380, "loss_range": (8, 12), "quality_range": (75, 85)},   # Tea - excellent quality
        {"base_prod": 420, "loss_range": (15, 20), "quality_range": (60, 70)}   # Quinoa - higher loss
    ]
    
    for coop_idx, coop in enumerate(cooperatives):
        variation = coop_variations[coop_idx]
        for i in range(10):
            date = datetime.now(timezone.utc) - timedelta(days=i*3)
            import random
            loss_pct = random.uniform(*variation["loss_range"])
            quality_a = random.uniform(*variation["quality_range"])
            production = variation["base_prod"] + (i * 25)
            
            log = {
                "id": str(uuid.uuid4()),
                "cooperative_id": coop['id'],
                "date": date.isoformat(),
                "batch_period": f"Week {10-i}",
                "total_production": production,
                "grade_a_percent": round(quality_a, 1),
                "grade_b_percent": round(100 - quality_a, 1),
                "post_harvest_loss_percent": round(loss_pct, 1),
                "post_harvest_loss_kg": round(production * loss_pct / 100, 2),
                "energy_use": ["Low", "Medium", "High"][i % 3],
                "has_nonconformity": i % 5 == 0,
                "nonconformity_description": "Quality issues with batch" if i % 5 == 0 else None,
                "corrective_action": "Improved sorting process" if i % 5 == 0 else None,
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
    
    # User emails for assignment
    user_emails = ["officer@dims.com", "manager@dims.com", "quality.officer@example.com", "safety.manager@example.com"]
    
    # Add more standalone nonconformities with realistic ISO-specific issues
    additional_ncs = [
        # ISO 9001 Quality Issues
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[0]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "category": "quality",
            "severity": "critical",
            "description": "ISO 9001.8.5.2 - Traceability failure: Batch identification records missing for 3 shipments, violating customer requirements and recall procedures",
            "corrective_action": "Implementing automated batch tracking system with QR codes, conducting staff training on documentation procedures, and establishing daily verification checks",
            "status": "in_progress",
            "assigned_to": user_emails[2],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[1]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "category": "quality",
            "severity": "high",
            "description": "ISO 9001.8.6 - Release of non-conforming product: 150kg of product released without final quality inspection approval, customer complaint received",
            "corrective_action": "Suspended operations pending investigation, implemented mandatory sign-off procedure, installing automated gate system to prevent unauthorized release",
            "status": "open",
            "assigned_to": user_emails[0],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[2]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "category": "quality",
            "severity": "medium",
            "description": "ISO 9001.7.1.5 - Monitoring equipment calibration overdue: pH meters and moisture analyzers not calibrated for 8 months, affecting measurement reliability",
            "corrective_action": "Arranged external calibration service, established calibration schedule with automated reminders, updated equipment log system",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "assigned_to": user_emails[2],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        },
        # ISO 14001 Environmental Issues
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[2]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
            "category": "environmental",
            "severity": "critical",
            "description": "ISO 14001.8.2 - Emergency preparedness failure: Chemical spill containment system inadequate, 50L pesticide leaked into drainage affecting local water source",
            "corrective_action": "Emergency response team deployed, soil remediation initiated, installing secondary containment system with leak detection, notifying environmental authorities",
            "status": "open",
            "assigned_to": user_emails[1],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[3]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat(),
            "category": "environmental",
            "severity": "high",
            "description": "ISO 14001.8.1 - Operational control: Exceeding water extraction permit limits by 30%, violating environmental compliance obligations",
            "corrective_action": "Installed water flow meters with automatic shutoff, implemented water recycling system, applied for permit amendment, conducting water efficiency training",
            "status": "in_progress",
            "assigned_to": user_emails[0],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[0]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            "category": "environmental",
            "severity": "medium",
            "description": "ISO 14001.6.1.4 - Environmental aspects: Waste segregation not implemented, 40% recyclable materials going to landfill instead of recycling facility",
            "corrective_action": "Installed color-coded waste bins at all stations, trained staff on waste segregation, contracted certified recycling service, establishing monthly waste audits",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=8)).isoformat(),
            "assigned_to": user_emails[1],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[1]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=6)).isoformat(),
            "category": "environmental",
            "severity": "low",
            "description": "ISO 14001.9.1 - Monitoring: Energy consumption records incomplete for past 3 months, preventing accurate carbon footprint calculation",
            "corrective_action": "Installing smart meters with automated logging, designating energy coordinator, implementing monthly energy review meetings",
            "status": "in_progress",
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=6)).isoformat()
        },
        # ISO 45001 Safety Issues  
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[3]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "category": "safety",
            "severity": "critical",
            "description": "ISO 45001.8.1.2 - Eliminating hazards: Heavy machinery operating without proper guarding, worker sustained hand injury requiring medical treatment",
            "corrective_action": "Machine immediately taken out of service, installing safety guards per manufacturer specs, investigating root cause, reviewing all machinery safety controls",
            "status": "open",
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[0]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=9)).isoformat(),
            "category": "safety",
            "severity": "high",
            "description": "ISO 45001.7.2 - Competence: 15 workers operating forklifts without valid certification or documented training records",
            "corrective_action": "Suspended forklift operations, arranged certified training program, implementing competency matrix and training record system, scheduling refresher training annually",
            "status": "in_progress",
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=9)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[2]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(),
            "category": "safety",
            "severity": "high",
            "description": "ISO 45001.8.2 - Emergency preparedness: Fire extinguishers expired (last inspection 18 months ago), emergency evacuation plan not practiced, first aid kits incomplete",
            "corrective_action": "All fire equipment serviced and certified, conducted emergency drill, restocked first aid supplies, appointed fire wardens, scheduling quarterly emergency drills",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[1]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=8)).isoformat(),
            "category": "safety",
            "severity": "medium",
            "description": "ISO 45001.5.4 - Worker consultation: No documented safety committee meetings for 6 months, workers not consulted on recent process changes affecting safety",
            "corrective_action": "Reconvened safety committee with worker representatives, scheduling monthly meetings, implementing suggestion box system, documenting all consultations",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
            "assigned_to": user_emails[0],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[3]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
            "category": "safety",
            "severity": "medium",
            "description": "ISO 45001.7.3 - Awareness: Workers not aware of chemical hazards, SDS (Safety Data Sheets) not available in local language, inadequate hazard communication",
            "corrective_action": "Translating all SDS to local languages, conducting hazard communication training, installing pictogram signage, creating easy-reference hazard guides",
            "status": "in_progress",
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        },
        # Additional quality issues
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[2]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=11)).isoformat(),
            "category": "quality",
            "severity": "low",
            "description": "ISO 9001.7.5 - Documented information: Quality records stored inconsistently, some paper-based and some digital, making retrieval difficult during audits",
            "corrective_action": "Implementing centralized document management system, digitizing historical records, establishing document control procedures with version management",
            "status": "in_progress",
            "assigned_to": user_emails[2],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=11)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[0]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat(),
            "category": "quality",
            "severity": "medium",
            "description": "ISO 9001.8.7 - Control of nonconforming outputs: No formal process for handling customer complaints, 5 complaints pending resolution without documented investigation",
            "corrective_action": "Establishing customer complaint management system with tracking numbers, assigning complaint coordinator, implementing 48-hour response policy",
            "status": "open",
            "assigned_to": user_emails[0],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[1]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat(),
            "category": "quality",
            "severity": "high",
            "description": "ISO 9001.9.1.2 - Customer satisfaction: Customer survey reveals 40% dissatisfaction with delivery times, impacting repeat business and contract renewals",
            "corrective_action": "Analyzing logistics process, negotiating with transport provider, implementing order tracking system, establishing regular customer communication protocol",
            "status": "in_progress",
            "assigned_to": user_emails[2],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=20)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[3]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=18)).isoformat(),
            "category": "quality",
            "severity": "low",
            "description": "ISO 9001.10.2 - Nonconformity and corrective action: Root cause analysis not conducted for recurring quality issues, corrective actions addressing symptoms only",
            "corrective_action": "Training quality team in 5-Why and fishbone analysis methods, implementing corrective action tracking system with effectiveness verification",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=12)).isoformat(),
            "assigned_to": user_emails[2],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=18)).isoformat()
        },
        # Additional environmental issues
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[0]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=13)).isoformat(),
            "category": "environmental",
            "severity": "medium",
            "description": "ISO 14001.7.4.1 - Communication: Environmental policy not displayed or communicated to workers, external stakeholders unaware of environmental commitments",
            "corrective_action": "Printing and posting environmental policy in all work areas, conducting awareness sessions, publishing environmental commitments on website",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
            "assigned_to": user_emails[1],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=13)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[2]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=16)).isoformat(),
            "category": "environmental",
            "severity": "high",
            "description": "ISO 14001.8.1 - Operational control: Fuel storage tanks showing signs of corrosion, potential soil contamination risk from leakage",
            "corrective_action": "Tank integrity testing conducted, repairs scheduled, installing leak detection system, implementing monthly visual inspection protocol",
            "status": "in_progress",
            "assigned_to": user_emails[0],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=16)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[1]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=21)).isoformat(),
            "category": "environmental",
            "severity": "medium",
            "description": "ISO 14001.9.1.1 - Monitoring: Air quality monitoring not conducted despite operations generating dust particles, potential worker and community impact",
            "corrective_action": "Contracted environmental consultant for baseline air quality assessment, installing dust suppression system, establishing quarterly monitoring schedule",
            "status": "open",
            "assigned_to": user_emails[1],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=21)).isoformat()
        },
        # Additional safety issues
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[0]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=17)).isoformat(),
            "category": "safety",
            "severity": "high",
            "description": "ISO 45001.8.1.3 - Management of change: New packaging equipment installed without hazard assessment, workers not trained on new safety procedures",
            "corrective_action": "Conducting comprehensive risk assessment for new equipment, developing SOPs with safety controls, providing hands-on training before resuming operations",
            "status": "in_progress",
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=17)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[3]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=22)).isoformat(),
            "category": "safety",
            "severity": "low",
            "description": "ISO 45001.9.1.2 - Monitoring: Noise levels not measured despite loud machinery operation, hearing protection not consistently enforced",
            "corrective_action": "Conducted noise survey identifying high-risk areas, procuring and distributing hearing protection, establishing hearing conservation program with audiometric testing",
            "status": "closed",
            "closed_date": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(),
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=22)).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "cooperative_id": cooperatives[2]['id'],
            "date": (datetime.now(timezone.utc) - timedelta(days=19)).isoformat(),
            "category": "safety",
            "severity": "medium",
            "description": "ISO 45001.7.4 - Communication: Near-miss reporting system not functioning, workers reluctant to report incidents due to fear of reprisal",
            "corrective_action": "Establishing anonymous reporting system, conducting non-blame culture training for supervisors, implementing incident investigation procedure focusing on system improvement",
            "status": "in_progress",
            "assigned_to": user_emails[3],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=19)).isoformat()
        }
    ]
    
    await db.nonconformities.insert_many(additional_ncs)
    
    # Update manager user's cooperative_id to the first cooperative
    manager_update = await db.users.update_one(
        {"email": "manager@dims.com"},
        {"$set": {"cooperative_id": cooperatives[0]['id']}}
    )
    
    total_ncs = len(additional_ncs)
    return {
        "message": "MVP sample data initialized successfully", 
        "cooperatives": len(cooperatives), 
        "nonconformities": total_ncs, 
        "users_referenced": len(user_emails),
        "manager_updated": manager_update.modified_count > 0
    }

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