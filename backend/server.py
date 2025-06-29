from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import logging
import random
import string

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Empower U - Word Weaver API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'empower_u_app')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "empower-u-secret-key-change-in-production"
ALGORITHM = "HS256"

# Enhanced Greek and Latin content based on Membean curriculum
SAMPLE_CONTENT = [
    # Greek Prefixes
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "anti-",
        "origin": "Greek",
        "meaning": "against, opposite",
        "examples": ["antifreeze", "antisocial", "anticlimactic"],
        "definition": "A prefix meaning against or opposite to something",
        "difficulty": "beginner",
        "points": 10,
        "category": "opposition"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "auto-",
        "origin": "Greek",
        "meaning": "self",
        "examples": ["automobile", "automatic", "autobiography"],
        "definition": "A prefix meaning self or same",
        "difficulty": "beginner",
        "points": 10,
        "category": "self"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "bio-",
        "origin": "Greek",
        "meaning": "life",
        "examples": ["biology", "biography", "biodegradable"],
        "definition": "A prefix meaning life or living things",
        "difficulty": "intermediate",
        "points": 15,
        "category": "life"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "geo-",
        "origin": "Greek",
        "meaning": "earth",
        "examples": ["geography", "geology", "geometric"],
        "definition": "A prefix meaning earth or ground",
        "difficulty": "intermediate",
        "points": 15,
        "category": "earth"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "micro-",
        "origin": "Greek",
        "meaning": "small",
        "examples": ["microscope", "microwave", "microphone"],
        "definition": "A prefix meaning very small",
        "difficulty": "intermediate",
        "points": 15,
        "category": "size"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "tele-",
        "origin": "Greek",
        "meaning": "far, distant",
        "examples": ["telephone", "television", "telescope"],
        "definition": "A prefix meaning far away or at a distance",
        "difficulty": "beginner",
        "points": 10,
        "category": "distance"
    },
    
    # Latin Prefixes
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "pre-",
        "origin": "Latin",
        "meaning": "before",
        "examples": ["preview", "predict", "prepare"],
        "definition": "A prefix meaning before in time or place",
        "difficulty": "beginner",
        "points": 10,
        "category": "time"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "re-",
        "origin": "Latin",
        "meaning": "again, back",
        "examples": ["return", "rebuild", "recall"],
        "definition": "A prefix meaning again or back",
        "difficulty": "beginner",
        "points": 10,
        "category": "repetition"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "sub-",
        "origin": "Latin",
        "meaning": "under, below",
        "examples": ["submarine", "subway", "subzero"],
        "definition": "A prefix meaning under or below",
        "difficulty": "intermediate",
        "points": 15,
        "category": "position"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "super-",
        "origin": "Latin",
        "meaning": "above, over",
        "examples": ["superhero", "superior", "supernatural"],
        "definition": "A prefix meaning above or beyond normal",
        "difficulty": "intermediate",
        "points": 15,
        "category": "position"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "trans-",
        "origin": "Latin",
        "meaning": "across, through",
        "examples": ["transport", "translate", "transform"],
        "definition": "A prefix meaning across or through",
        "difficulty": "intermediate",
        "points": 15,
        "category": "movement"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "inter-",
        "origin": "Latin",
        "meaning": "between, among",
        "examples": ["international", "internet", "interview"],
        "definition": "A prefix meaning between or among",
        "difficulty": "advanced",
        "points": 20,
        "category": "position"
    },
    
    # Greek Roots
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "graph",
        "origin": "Greek", 
        "meaning": "write, draw",
        "examples": ["photograph", "biography", "paragraph"],
        "definition": "A root word meaning to write or draw",
        "difficulty": "intermediate",
        "points": 15,
        "category": "communication"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "phon",
        "origin": "Greek",
        "meaning": "sound",
        "examples": ["telephone", "symphony", "microphone"],
        "definition": "A root word meaning sound or voice",
        "difficulty": "intermediate",
        "points": 15,
        "category": "sound"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "photo",
        "origin": "Greek",
        "meaning": "light",
        "examples": ["photograph", "photosynthesis", "photocopy"],
        "definition": "A root word meaning light",
        "difficulty": "intermediate",
        "points": 15,
        "category": "light"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "scope",
        "origin": "Greek",
        "meaning": "see, look",
        "examples": ["telescope", "microscope", "stethoscope"],
        "definition": "A root word meaning to see or examine",
        "difficulty": "advanced",
        "points": 20,
        "category": "vision"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "meter",
        "origin": "Greek",
        "meaning": "measure",
        "examples": ["thermometer", "speedometer", "kilometer"],
        "definition": "A root word meaning to measure",
        "difficulty": "advanced",
        "points": 20,
        "category": "measurement"
    },
    
    # Latin Roots
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "port",
        "origin": "Latin",
        "meaning": "carry",
        "examples": ["transport", "portable", "export"],
        "definition": "A root word meaning to carry or bear",
        "difficulty": "intermediate",
        "points": 15,
        "category": "movement"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "dict",
        "origin": "Latin",
        "meaning": "say, speak",
        "examples": ["dictionary", "predict", "contradict"],
        "definition": "A root meaning to say or speak",
        "difficulty": "intermediate",
        "points": 15,
        "category": "communication"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "spect",
        "origin": "Latin",
        "meaning": "look, see",
        "examples": ["inspect", "respect", "spectacle"],
        "definition": "A root meaning to look or see",
        "difficulty": "intermediate",
        "points": 15,
        "category": "vision"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "ject",
        "origin": "Latin",
        "meaning": "throw",
        "examples": ["project", "reject", "eject"],
        "definition": "A root meaning to throw or cast",
        "difficulty": "advanced",
        "points": 20,
        "category": "action"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "struct",
        "origin": "Latin",
        "meaning": "build",
        "examples": ["construct", "structure", "instruct"],
        "definition": "A root meaning to build or arrange",
        "difficulty": "advanced",
        "points": 20,
        "category": "building"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "tract",
        "origin": "Latin",
        "meaning": "pull, draw",
        "examples": ["attract", "contract", "extract"],
        "definition": "A root meaning to pull or draw",
        "difficulty": "advanced",
        "points": 20,
        "category": "movement"
    },
    
    # Greek Suffixes
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-ology",
        "origin": "Greek",
        "meaning": "study of",
        "examples": ["biology", "psychology", "geology"],
        "definition": "A suffix meaning the study of something",
        "difficulty": "advanced",
        "points": 20,
        "category": "knowledge"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-phobia",
        "origin": "Greek",
        "meaning": "fear of",
        "examples": ["claustrophobia", "arachnophobia", "hydrophobia"],
        "definition": "A suffix meaning fear or dread of something",
        "difficulty": "advanced",
        "points": 20,
        "category": "emotion"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-ism",
        "origin": "Greek",
        "meaning": "belief, condition",
        "examples": ["patriotism", "criticism", "heroism"],
        "definition": "A suffix indicating a belief, practice, or condition",
        "difficulty": "advanced",
        "points": 20,
        "category": "belief"
    },
    
    # Latin Suffixes
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-tion",
        "origin": "Latin", 
        "meaning": "act, state",
        "examples": ["creation", "education", "celebration"],
        "definition": "A suffix indicating an action or state",
        "difficulty": "intermediate",
        "points": 15,
        "category": "action"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-able",
        "origin": "Latin",
        "meaning": "capable of",
        "examples": ["readable", "comfortable", "reliable"],
        "definition": "A suffix meaning capable of or worthy of",
        "difficulty": "beginner",
        "points": 10,
        "category": "ability"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-ment",
        "origin": "Latin",
        "meaning": "result, action",
        "examples": ["movement", "achievement", "development"],
        "definition": "A suffix indicating the result of an action",
        "difficulty": "intermediate",
        "points": 15,
        "category": "result"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-ous",
        "origin": "Latin",
        "meaning": "full of, having",
        "examples": ["dangerous", "famous", "curious"],
        "definition": "A suffix meaning full of or characterized by",
        "difficulty": "intermediate",
        "points": 15,
        "category": "quality"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-ity",
        "origin": "Latin",
        "meaning": "state, quality",
        "examples": ["personality", "reality", "creativity"],
        "definition": "A suffix indicating a state or quality",
        "difficulty": "advanced",
        "points": 20,
        "category": "quality"
    },
    
    # Additional Important Roots
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "form",
        "origin": "Latin",
        "meaning": "shape",
        "examples": ["transform", "uniform", "deform"],
        "definition": "A root meaning shape or appearance",
        "difficulty": "intermediate",
        "points": 15,
        "category": "shape"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "sens",
        "origin": "Latin",
        "meaning": "feel",
        "examples": ["sensitive", "nonsense", "sensor"],
        "definition": "A root meaning to feel or perceive",
        "difficulty": "intermediate",
        "points": 15,
        "category": "feeling"
    }
]

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    is_teacher: bool = False
    # New student profile fields
    grade: Optional[str] = None
    school: Optional[str] = None
    block_number: Optional[str] = None
    teacher: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    is_teacher: bool
    created_at: datetime
    level: int = 1
    total_points: int = 0
    streak_days: int = 0
    badges: List[str] = []
    # New student profile fields
    grade: Optional[str] = None
    school: Optional[str] = None
    block_number: Optional[str] = None
    teacher: Optional[str] = None

class WordCard(BaseModel):
    id: str
    type: str
    root: str
    origin: str
    meaning: str
    examples: List[str]
    definition: str
    difficulty: str
    points: int
    category: str

class StudySession(BaseModel):
    user_id: str
    word_id: str
    correct: bool
    timestamp: datetime
    points_earned: int = 0

class QuizResult(BaseModel):
    user_id: str
    score: int
    total_questions: int
    timestamp: datetime
    points_earned: int = 0

class UserProgress(BaseModel):
    user_id: str
    mastered_words: List[str] = []
    studying_words: List[str] = []
    difficult_words: List[str] = []

class LoginCode(BaseModel):
    id: str
    code: str
    teacher_id: str
    class_name: str
    block_number: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    max_uses: int = 50
    current_uses: int = 0
    expires_at: datetime
    active: bool = True
    created_at: datetime

class LoginCodeCreate(BaseModel):
    class_name: str
    block_number: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    max_uses: int = 50
    expires_in_days: int = 30

class StudentRegisterWithCode(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    login_code: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def calculate_level(points: int) -> int:
    """Calculate user level based on points"""
    if points < 100:
        return 1
    elif points < 250:
        return 2
    elif points < 500:
        return 3
    elif points < 1000:
        return 4
    elif points < 2000:
        return 5
    else:
        return min(10, 5 + (points - 2000) // 500)

def get_badges(points: int, level: int, streak: int) -> List[str]:
    """Determine earned badges"""
    badges = []
    if points >= 100:
        badges.append("First Century")
    if points >= 500:
        badges.append("Word Warrior")
    if points >= 1000:
        badges.append("Scholar Supreme")
    if level >= 5:
        badges.append("Level Master")
    if streak >= 7:
        badges.append("Week Warrior")
    if streak >= 30:
        badges.append("Monthly Master")
    return badges

def generate_login_code() -> str:
    """Generate a unique login code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize sample content and admin user on startup
@app.on_event("startup")
async def startup_event():
    # AUTOMATIC BACKUP: First, backup existing content before any changes
    existing_words = []
    async for word in db.words.find({}):
        word.pop('_id', None)  # Remove MongoDB _id for clean backup
        existing_words.append(word)
    
    if existing_words:
        # Create backup with timestamp
        backup_timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_collection = f"words_backup_{backup_timestamp}"
        await db[backup_collection].insert_many(existing_words)
        logger.info(f"🔐 BACKUP CREATED: {len(existing_words)} words backed up to {backup_collection}")
    
    # PRESERVE EXISTING CONTENT: Only add sample content if database is completely empty
    word_count = await db.words.count_documents({})
    if word_count == 0:
        await db.words.insert_many(SAMPLE_CONTENT)
        logger.info(f"✅ Initialized {len(SAMPLE_CONTENT)} sample Greek and Latin word elements")
    else:
        logger.info(f"✅ Preserved existing {word_count} word cards (no data loss)")
    
    # Create admin user if doesn't exist
    admin_exists = await db.users.find_one({"email": "admin@empoweru.com"})
    if not admin_exists:
        admin_id = str(uuid.uuid4())
        admin_doc = {
            "id": admin_id,
            "email": "admin@empoweru.com",
            "password": hash_password("EmpowerU2024!"),
            "first_name": "Admin",
            "last_name": "User",
            "is_teacher": True,
            "created_at": datetime.utcnow(),
            "level": 10,
            "total_points": 10000,
            "streak_days": 0,
            "badges": ["Admin", "Founder"]
        }
        await db.users.insert_one(admin_doc)
        logger.info("Created admin user: admin@empoweru.com / EmpowerU2024!")

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "Empower U - Word Weaver", "timestamp": datetime.utcnow()}

@app.post("/api/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Only allow teacher registration by admin invitation (for now, allow for testing)
    # In production, you'd check for invitation codes here
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "is_teacher": user_data.is_teacher,
        "created_at": datetime.utcnow(),
        "level": 1,
        "total_points": 0,
        "streak_days": 0,
        "badges": [],
        # New student profile fields
        "grade": user_data.grade,
        "school": user_data.school,
        "block_number": user_data.block_number,
        "teacher": user_data.teacher
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token({"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "is_teacher": user_data.is_teacher,
            "level": 1,
            "total_points": 0,
            "badges": [],
            "grade": user_data.grade,
            "school": user_data.school,
            "block_number": user_data.block_number,
            "teacher": user_data.teacher
        }
    }

@app.post("/api/register-with-code")
async def register_with_code(user_data: StudentRegisterWithCode):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    login_code_info = None
    teacher_name = None
    
    # If login code provided, validate and get class information
    if user_data.login_code:
        code = user_data.login_code.upper().strip()
        login_code = await db.login_codes.find_one({"code": code, "active": True})
        
        if not login_code:
            raise HTTPException(status_code=400, detail="Invalid or inactive login code")
        
        # Check if expired
        if datetime.utcnow() > login_code["expires_at"]:
            raise HTTPException(status_code=400, detail="Login code has expired")
        
        # Check if max uses reached
        if login_code["current_uses"] >= login_code["max_uses"]:
            raise HTTPException(status_code=400, detail="Login code usage limit reached")
        
        # Get teacher information
        teacher = await db.users.find_one({"id": login_code["teacher_id"]})
        teacher_name = f"{teacher['first_name']} {teacher['last_name']}" if teacher else "Unknown Teacher"
        
        login_code_info = login_code
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    # Use login code info to populate user profile if available
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "is_teacher": False,  # Students only for code registration
        "created_at": datetime.utcnow(),
        "level": 1,
        "total_points": 0,
        "streak_days": 0,
        "badges": [],
        # Auto-populate from login code if available
        "grade": login_code_info["grade"] if login_code_info else None,
        "school": login_code_info["school"] if login_code_info else None,
        "block_number": login_code_info["block_number"] if login_code_info else None,
        "teacher": teacher_name if teacher_name else None,
        "class_name": login_code_info["class_name"] if login_code_info else None
    }
    
    await db.users.insert_one(user_doc)
    
    # If login code was used, increment usage counter
    if login_code_info:
        await db.login_codes.update_one(
            {"id": login_code_info["id"]},
            {"$inc": {"current_uses": 1}}
        )
        logger.info(f"🎓 STUDENT REGISTERED WITH CODE: {user_data.email} used code {login_code_info['code']} for class {login_code_info['class_name']}")
    
    # Create access token
    access_token = create_access_token({"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "is_teacher": False,
            "level": 1,
            "total_points": 0,
            "badges": [],
            "grade": user_doc["grade"],
            "school": user_doc["school"],
            "block_number": user_doc["block_number"],
            "teacher": user_doc["teacher"],
            "class_name": user_doc.get("class_name")
        },
        "used_login_code": login_code_info["code"] if login_code_info else None,
        "class_info": {
            "class_name": login_code_info["class_name"],
            "teacher_name": teacher_name
        } if login_code_info else None
    }

@app.post("/api/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "is_teacher": user["is_teacher"],
            "level": user.get("level", 1),
            "total_points": user.get("total_points", 0),
            "badges": user.get("badges", [])
        }
    }

@app.get("/api/words", response_model=List[WordCard])
async def get_words(current_user: dict = Depends(get_current_user)):
    words = []
    async for word in db.words.find({}):
        words.append(WordCard(**word))
    return words

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    level = calculate_level(current_user.get("total_points", 0))
    badges = get_badges(
        current_user.get("total_points", 0),
        level,
        current_user.get("streak_days", 0)
    )
    
    # Update user with calculated values
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"level": level, "badges": badges}}
    )
    
    return {
        "id": current_user["id"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "email": current_user["email"],
        "is_teacher": current_user.get("is_teacher", False),
        "level": level,
        "total_points": current_user.get("total_points", 0),
        "streak_days": current_user.get("streak_days", 0),
        "badges": badges,
        "grade": current_user.get("grade"),
        "school": current_user.get("school"),
        "block_number": current_user.get("block_number"),
        "teacher": current_user.get("teacher")
    }

@app.post("/api/study-session")
async def record_study_session(session: StudySession, current_user: dict = Depends(get_current_user)):
    # Get word to determine points
    word = await db.words.find_one({"id": session.word_id})
    points_earned = word.get("points", 10) if session.correct else 0
    
    session_doc = {
        "user_id": session.user_id,
        "word_id": session.word_id,
        "correct": session.correct,
        "timestamp": session.timestamp,
        "points_earned": points_earned
    }
    await db.study_sessions.insert_one(session_doc)
    
    # Update user points
    if points_earned > 0:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"total_points": points_earned}}
        )
    
    return {"status": "recorded", "points_earned": points_earned}

@app.post("/api/quiz-result")
async def record_quiz_result(result: QuizResult, current_user: dict = Depends(get_current_user)):
    points_earned = result.score * 5  # 5 points per correct answer
    
    result_doc = {
        "user_id": result.user_id,
        "score": result.score,
        "total_questions": result.total_questions,
        "timestamp": result.timestamp,
        "points_earned": points_earned
    }
    await db.quiz_results.insert_one(result_doc)
    
    # Update user points
    if points_earned > 0:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"total_points": points_earned}}
        )
    
    return {"status": "recorded", "points_earned": points_earned}

@app.get("/api/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = []
    async for user in db.users.find({}, {"password": 0}):  # Exclude password
        users.append({
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "is_teacher": user["is_teacher"],
            "created_at": user["created_at"],
            "level": user.get("level", 1),
            "total_points": user.get("total_points", 0),
            "streak_days": user.get("streak_days", 0),
            "badges": user.get("badges", []),
            # Include student profile information
            "grade": user.get("grade"),
            "school": user.get("school"),
            "block_number": user.get("block_number"),
            "teacher": user.get("teacher")
        })
    return users

@app.get("/api/admin/progress/{user_id}")
async def get_user_progress(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get study sessions
    sessions = []
    async for session in db.study_sessions.find({"user_id": user_id}):
        # Remove MongoDB _id field
        session.pop('_id', None)
        sessions.append(session)
    
    # Get quiz results
    quiz_results = []
    async for result in db.quiz_results.find({"user_id": user_id}):
        # Remove MongoDB _id field
        result.pop('_id', None)
        quiz_results.append(result)
    
    return {
        "user_id": user_id,
        "study_sessions": sessions,
        "quiz_results": quiz_results
    }

@app.get("/api/leaderboard")
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    """Get top students by points"""
    users = []
    async for user in db.users.find(
        {"is_teacher": False}, 
        {"password": 0}
    ).sort("total_points", -1).limit(10):
        users.append({
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "level": user.get("level", 1),
            "total_points": user.get("total_points", 0),
            "badges": user.get("badges", [])
        })
    return users

@app.post("/api/admin/create-word")
async def create_word(word_data: dict, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Generate new word ID
    word_id = str(uuid.uuid4())
    word_doc = {
        "id": word_id,
        **word_data
    }
    
    await db.words.insert_one(word_doc)
    return {"status": "created", "id": word_id}

@app.put("/api/admin/update-word/{word_id}")
async def update_word(word_id: str, word_data: dict, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.words.update_one(
        {"id": word_id},
        {"$set": word_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Word not found")
    
    return {"status": "updated"}

@app.delete("/api/admin/delete-word/{word_id}")
async def delete_word(word_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.words.delete_one({"id": word_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Word not found")
    
    return {"status": "deleted"}

@app.get("/api/admin/study-sets")
async def get_study_sets(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all custom study sets for this teacher
    study_sets = []
    async for study_set in db.study_sets.find({"teacher_id": current_user["id"]}):
        study_set.pop('_id', None)
        study_sets.append(study_set)
    
    return study_sets

@app.post("/api/admin/create-study-set")
async def create_study_set(study_set_data: dict, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    study_set_id = str(uuid.uuid4())
    study_set_doc = {
        "id": study_set_id,
        "teacher_id": current_user["id"],
        "name": study_set_data["name"],
        "description": study_set_data.get("description", ""),
        "word_ids": study_set_data["word_ids"],
        "created_at": datetime.utcnow()
    }
    
    await db.study_sets.insert_one(study_set_doc)
    return {"status": "created", "id": study_set_id}

@app.get("/api/admin/backups")
async def list_backups(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all backup collections
    collections = await db.list_collection_names()
    backup_collections = [col for col in collections if col.startswith("words_backup_")]
    
    backups = []
    for backup_col in backup_collections:
        count = await db[backup_col].count_documents({})
        timestamp_str = backup_col.replace("words_backup_", "")
        
        # Parse timestamp for readable format
        try:
            timestamp = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
            readable_time = timestamp.strftime("%Y-%m-%d %H:%M:%S")
        except:
            readable_time = timestamp_str
        
        backups.append({
            "collection_name": backup_col,
            "timestamp": timestamp_str,
            "readable_time": readable_time,
            "word_count": count
        })
    
    # Sort by timestamp (newest first)
    backups.sort(key=lambda x: x["timestamp"], reverse=True)
    return backups

@app.post("/api/admin/create-backup")
async def create_manual_backup(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get current words
    existing_words = []
    async for word in db.words.find({}):
        word.pop('_id', None)
        existing_words.append(word)
    
    if not existing_words:
        raise HTTPException(status_code=400, detail="No words to backup")
    
    # Create backup with timestamp
    backup_timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_collection = f"words_backup_{backup_timestamp}"
    await db[backup_collection].insert_many(existing_words)
    
    logger.info(f"🔐 MANUAL BACKUP CREATED: {len(existing_words)} words backed up to {backup_collection}")
    
    return {
        "status": "backup_created",
        "collection_name": backup_collection,
        "word_count": len(existing_words),
        "timestamp": backup_timestamp
    }

@app.post("/api/admin/restore-backup")
async def restore_backup(backup_data: dict, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    collection_name = backup_data.get("collection_name")
    if not collection_name or not collection_name.startswith("words_backup_"):
        raise HTTPException(status_code=400, detail="Invalid backup collection name")
    
    # Check if backup exists
    collections = await db.list_collection_names()
    if collection_name not in collections:
        raise HTTPException(status_code=404, detail="Backup not found")
    
    # Get backup data
    backup_words = []
    async for word in db[collection_name].find({}):
        word.pop('_id', None)
        backup_words.append(word)
    
    if not backup_words:
        raise HTTPException(status_code=400, detail="Backup is empty")
    
    # Create a backup of current state before restoring
    current_backup_timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    current_backup_collection = f"words_backup_before_restore_{current_backup_timestamp}"
    
    current_words = []
    async for word in db.words.find({}):
        word.pop('_id', None)
        current_words.append(word)
    
    if current_words:
        await db[current_backup_collection].insert_many(current_words)
        logger.info(f"🔐 PRE-RESTORE BACKUP: {len(current_words)} words backed up to {current_backup_collection}")
    
    # Clear current words and restore from backup
    await db.words.delete_many({})
    await db.words.insert_many(backup_words)
    
    logger.info(f"✅ RESTORED: {len(backup_words)} words restored from {collection_name}")
    
    return {
        "status": "restored",
        "restored_from": collection_name,
        "word_count": len(backup_words),
        "pre_restore_backup": current_backup_collection
    }

# Login Code Management Endpoints

@app.post("/api/admin/create-login-code")
async def create_login_code(code_data: LoginCodeCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Generate unique code
    code = generate_login_code()
    
    # Ensure code is unique
    while await db.login_codes.find_one({"code": code, "active": True}):
        code = generate_login_code()
    
    # Calculate expiration date
    expires_at = datetime.utcnow() + timedelta(days=code_data.expires_in_days)
    
    login_code_doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "teacher_id": current_user["id"],
        "class_name": code_data.class_name,
        "block_number": code_data.block_number,
        "school": code_data.school,
        "grade": code_data.grade,
        "max_uses": code_data.max_uses,
        "current_uses": 0,
        "expires_at": expires_at,
        "active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.login_codes.insert_one(login_code_doc)
    
    logger.info(f"✅ LOGIN CODE CREATED: {code} for class {code_data.class_name} by teacher {current_user['email']}")
    
    return {
        "status": "created",
        "login_code": {
            "id": login_code_doc["id"],
            "code": code,
            "class_name": code_data.class_name,
            "block_number": code_data.block_number,
            "school": code_data.school,
            "grade": code_data.grade,
            "max_uses": code_data.max_uses,
            "expires_at": expires_at.isoformat(),
            "created_at": login_code_doc["created_at"].isoformat()
        }
    }

@app.get("/api/admin/login-codes")
async def get_login_codes(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    login_codes = []
    async for code in db.login_codes.find({"teacher_id": current_user["id"]}).sort("created_at", -1):
        code.pop('_id', None)
        
        # Check if code is expired
        is_expired = datetime.utcnow() > code["expires_at"]
        
        login_codes.append({
            "id": code["id"],
            "code": code["code"],
            "class_name": code["class_name"],
            "block_number": code["block_number"],
            "school": code["school"],
            "grade": code["grade"],
            "max_uses": code["max_uses"],
            "current_uses": code["current_uses"],
            "expires_at": code["expires_at"].isoformat(),
            "active": code["active"],
            "is_expired": is_expired,
            "created_at": code["created_at"].isoformat()
        })
    
    return login_codes

@app.put("/api/admin/login-code/{code_id}/toggle")
async def toggle_login_code(code_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find the code
    code = await db.login_codes.find_one({"id": code_id, "teacher_id": current_user["id"]})
    if not code:
        raise HTTPException(status_code=404, detail="Login code not found")
    
    # Toggle active status
    new_active_status = not code["active"]
    
    result = await db.login_codes.update_one(
        {"id": code_id},
        {"$set": {"active": new_active_status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Login code not found")
    
    logger.info(f"🔄 LOGIN CODE TOGGLED: {code['code']} -> active: {new_active_status}")
    
    return {
        "status": "updated",
        "code": code["code"],
        "active": new_active_status
    }

@app.delete("/api/admin/login-code/{code_id}")
async def delete_login_code(code_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find the code first to get details for logging
    code = await db.login_codes.find_one({"id": code_id, "teacher_id": current_user["id"]})
    if not code:
        raise HTTPException(status_code=404, detail="Login code not found")
    
    result = await db.login_codes.delete_one({"id": code_id, "teacher_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Login code not found")
    
    logger.info(f"🗑️ LOGIN CODE DELETED: {code['code']} for class {code['class_name']}")
    
    return {"status": "deleted", "code": code["code"]}

@app.post("/api/validate-login-code")
async def validate_login_code(code_data: dict):
    """Validate a login code and return class information"""
    code = code_data.get("code", "").upper().strip()
    
    if not code:
        raise HTTPException(status_code=400, detail="Login code is required")
    
    # Find the login code
    login_code = await db.login_codes.find_one({"code": code, "active": True})
    
    if not login_code:
        raise HTTPException(status_code=404, detail="Invalid or inactive login code")
    
    # Check if expired
    if datetime.utcnow() > login_code["expires_at"]:
        raise HTTPException(status_code=400, detail="Login code has expired")
    
    # Check if max uses reached
    if login_code["current_uses"] >= login_code["max_uses"]:
        raise HTTPException(status_code=400, detail="Login code usage limit reached")
    
    # Get teacher information
    teacher = await db.users.find_one({"id": login_code["teacher_id"]})
    teacher_name = f"{teacher['first_name']} {teacher['last_name']}" if teacher else "Unknown Teacher"
    
    return {
        "valid": True,
        "class_info": {
            "class_name": login_code["class_name"],
            "block_number": login_code["block_number"],
            "school": login_code["school"],
            "grade": login_code["grade"],
            "teacher_name": teacher_name,
            "uses_remaining": login_code["max_uses"] - login_code["current_uses"]
        }
    }

@app.get("/api/admin/student/{student_id}")
async def get_student_profile(student_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get student profile
    student = await db.users.find_one({"id": student_id}, {"password": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get student analytics
    # Study sessions
    study_sessions = []
    async for session in db.study_sessions.find({"user_id": student_id}):
        session.pop('_id', None)
        study_sessions.append(session)
    
    # Quiz results
    quiz_results = []
    async for result in db.quiz_results.find({"user_id": student_id}):
        result.pop('_id', None)
        quiz_results.append(result)
    
    # Calculate analytics
    total_sessions = len(study_sessions)
    correct_sessions = len([s for s in study_sessions if s.get('correct', False)])
    accuracy_rate = (correct_sessions / total_sessions * 100) if total_sessions > 0 else 0
    
    total_quizzes = len(quiz_results)
    average_quiz_score = sum([r.get('score', 0) for r in quiz_results]) / total_quizzes if total_quizzes > 0 else 0
    
    # Recent activity (last 7 days)
    from datetime import timedelta
    recent_date = datetime.utcnow() - timedelta(days=7)
    recent_sessions = [s for s in study_sessions if datetime.fromisoformat(s.get('timestamp', '').replace('Z', '+00:00')) > recent_date]
    
    analytics = {
        "total_study_sessions": total_sessions,
        "accuracy_rate": round(accuracy_rate, 1),
        "total_quizzes": total_quizzes,
        "average_quiz_score": round(average_quiz_score, 1),
        "recent_activity_count": len(recent_sessions),
        "study_sessions": study_sessions[-10:],  # Last 10 sessions
        "quiz_results": quiz_results[-5:],  # Last 5 quiz results
    }
    
    return {
        "student": {
            "id": student["id"],
            "email": student["email"],
            "first_name": student["first_name"],
            "last_name": student["last_name"],
            "is_teacher": student["is_teacher"],
            "created_at": student["created_at"],
            "level": student.get("level", 1),
            "total_points": student.get("total_points", 0),
            "streak_days": student.get("streak_days", 0),
            "badges": student.get("badges", []),
            "grade": student.get("grade"),
            "school": student.get("school"),
            "block_number": student.get("block_number"),
            "teacher": student.get("teacher")
        },
        "analytics": analytics
    }

@app.put("/api/admin/student/{student_id}")
async def update_student_profile(student_id: str, student_data: dict, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if student exists
    existing_student = await db.users.find_one({"id": student_id})
    if not existing_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update student profile
    update_data = {
        "first_name": student_data.get("first_name"),
        "last_name": student_data.get("last_name"), 
        "email": student_data.get("email"),
        "grade": student_data.get("grade"),
        "school": student_data.get("school"),
        "block_number": student_data.get("block_number"),
        "teacher": student_data.get("teacher")
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = await db.users.update_one(
        {"id": student_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {"status": "updated", "student_id": student_id}

@app.delete("/api/admin/student/{student_id}")
async def delete_student_profile(student_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if student exists
    student = await db.users.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student.get("is_teacher"):
        raise HTTPException(status_code=400, detail="Cannot delete administrator accounts")
    
    # Delete student and all associated data
    await db.users.delete_one({"id": student_id})
    await db.study_sessions.delete_many({"user_id": student_id})
    await db.quiz_results.delete_many({"user_id": student_id})
    
    return {"status": "deleted", "student_id": student_id}

@app.post("/api/admin/create-student")
async def create_student_profile(student_data: UserCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": student_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new student
    student_id = str(uuid.uuid4())
    hashed_password = hash_password(student_data.password)
    
    student_doc = {
        "id": student_id,
        "email": student_data.email,
        "password": hashed_password,
        "first_name": student_data.first_name,
        "last_name": student_data.last_name,
        "is_teacher": False,  # Always create as student
        "created_at": datetime.utcnow(),
        "level": 1,
        "total_points": 0,
        "streak_days": 0,
        "badges": [],
        "grade": student_data.grade,
        "school": student_data.school,
        "block_number": student_data.block_number,
        "teacher": student_data.teacher
    }
    
    await db.users.insert_one(student_doc)
    
    return {
        "status": "created",
        "student_id": student_id,
        "message": f"Student {student_data.first_name} {student_data.last_name} created successfully"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)