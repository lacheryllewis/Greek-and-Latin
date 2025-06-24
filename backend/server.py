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
    # Initialize sample words if collection is empty
    count = await db.words.count_documents({})
    if count == 0:
        await db.words.insert_many(SAMPLE_CONTENT)
        logger.info("Initialized sample Greek and Latin content")
    
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
        "badges": []
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
            "badges": []
        }
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
        "level": level,
        "total_points": current_user.get("total_points", 0),
        "streak_days": current_user.get("streak_days", 0),
        "badges": badges
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
            "badges": user.get("badges", [])
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)