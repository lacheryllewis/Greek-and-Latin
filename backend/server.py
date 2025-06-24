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

app = FastAPI(title="Greek Latin Learning API")

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
DB_NAME = os.environ.get('DB_NAME', 'greek_latin_app')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"

# Sample Greek and Latin content
SAMPLE_CONTENT = [
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "anti-",
        "origin": "Greek",
        "meaning": "against, opposite",
        "examples": ["antibody", "antifreeze", "antisocial"],
        "definition": "A prefix meaning against or opposite to something"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix", 
        "root": "pre-",
        "origin": "Latin",
        "meaning": "before",
        "examples": ["preview", "predict", "prepare"],
        "definition": "A prefix meaning before in time or place"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "graph",
        "origin": "Greek", 
        "meaning": "write, draw",
        "examples": ["photograph", "biography", "paragraph"],
        "definition": "A root word meaning to write or draw"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "port",
        "origin": "Latin",
        "meaning": "carry",
        "examples": ["transport", "portable", "export"],
        "definition": "A root word meaning to carry or bear"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-ology",
        "origin": "Greek",
        "meaning": "study of",
        "examples": ["biology", "psychology", "geology"],
        "definition": "A suffix meaning the study of something"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "suffix",
        "root": "-tion",
        "origin": "Latin", 
        "meaning": "act, state",
        "examples": ["creation", "education", "celebration"],
        "definition": "A suffix indicating an action or state"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "un-",
        "origin": "Old English",
        "meaning": "not, opposite",
        "examples": ["unhappy", "unfair", "unlock"],
        "definition": "A prefix meaning not or the opposite of"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "tele",
        "origin": "Greek",
        "meaning": "far, distant",
        "examples": ["telephone", "television", "telescope"],
        "definition": "A root meaning far away or at a distance"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "root",
        "root": "dict",
        "origin": "Latin",
        "meaning": "say, speak",
        "examples": ["dictionary", "predict", "contradict"],
        "definition": "A root meaning to say or speak"
    },
    {
        "id": str(uuid.uuid4()),
        "type": "prefix",
        "root": "re-",
        "origin": "Latin",
        "meaning": "again, back",
        "examples": ["return", "rebuild", "recall"],
        "definition": "A prefix meaning again or back"
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

class WordCard(BaseModel):
    id: str
    type: str
    root: str
    origin: str
    meaning: str
    examples: List[str]
    definition: str

class StudySession(BaseModel):
    user_id: str
    word_id: str
    correct: bool
    timestamp: datetime

class QuizResult(BaseModel):
    user_id: str
    score: int
    total_questions: int
    timestamp: datetime

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

# Initialize sample content on startup
@app.on_event("startup")
async def startup_event():
    # Initialize sample words if collection is empty
    count = await db.words.count_documents({})
    if count == 0:
        await db.words.insert_many(SAMPLE_CONTENT)
        logger.info("Initialized sample Greek and Latin content")

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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
        "created_at": datetime.utcnow()
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
            "is_teacher": user_data.is_teacher
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
            "is_teacher": user["is_teacher"]
        }
    }

@app.get("/api/words", response_model=List[WordCard])
async def get_words(current_user: dict = Depends(get_current_user)):
    words = []
    async for word in db.words.find({}):
        words.append(WordCard(**word))
    return words

@app.get("/api/words/{word_id}", response_model=WordCard)
async def get_word(word_id: str, current_user: dict = Depends(get_current_user)):
    word = await db.words.find_one({"id": word_id})
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return WordCard(**word)

@app.post("/api/study-session")
async def record_study_session(session: StudySession, current_user: dict = Depends(get_current_user)):
    session_doc = {
        "user_id": session.user_id,
        "word_id": session.word_id,
        "correct": session.correct,
        "timestamp": session.timestamp
    }
    await db.study_sessions.insert_one(session_doc)
    return {"status": "recorded"}

@app.post("/api/quiz-result")
async def record_quiz_result(result: QuizResult, current_user: dict = Depends(get_current_user)):
    result_doc = {
        "user_id": result.user_id,
        "score": result.score,
        "total_questions": result.total_questions,
        "timestamp": result.timestamp
    }
    await db.quiz_results.insert_one(result_doc)
    return {"status": "recorded"}

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
            "created_at": user["created_at"]
        })
    return users

@app.get("/api/admin/progress/{user_id}")
async def get_user_progress(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_teacher"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get study sessions
    sessions = []
    async for session in db.study_sessions.find({"user_id": user_id}):
        sessions.append(session)
    
    # Get quiz results
    quiz_results = []
    async for result in db.quiz_results.find({"user_id": user_id}):
        quiz_results.append(result)
    
    return {
        "user_id": user_id,
        "study_sessions": sessions,
        "quiz_results": quiz_results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)