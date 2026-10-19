
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pwdlib import PasswordHash
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import User
from schemas import LoginRequest, SignupRequest, UserResponse
from datetime import datetime, timedelta, timezone

app = FastAPI(
    title="ISHARA AI API",
    description="Backend API for the ISHARA AI project",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

password_hash = PasswordHash.recommended()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "project": "ISHARA AI",
        "message": "Backend is running!",
        "status": "success",
    }


@app.get("/api/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is unavailable.",
        )


@app.post(
    "/api/auth/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db),
):
    # Check whether the username or email is already registered.
    existing_user = (
        db.query(User)
        .filter(
            (User.username == request.username)
            | (User.email == request.email)
        )
        .first()
    )

    if existing_user:
        if existing_user.username == request.username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This username is already registered.",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered.",
        )

    # Hash the five-symbol sequence before storing it.
    sequence_text = ":".join(request.sequence)
    hashed_sequence = password_hash.hash(sequence_text)

    new_user = User(
        username=request.username,
        email=str(request.email),
        sequence_hash=hashed_sequence,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username or email is already registered.",
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create the account right now.",
        )

    return new_user

@app.post("/api/auth/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.username == request.username)
        .first()
    )

    # Use a generic error so the response doesn't reveal
    # whether a username exists.
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or symbol sequence.",
    )

    if user is None:
        raise invalid_credentials

    now = datetime.now(timezone.utc)

    # PostgreSQL normally returns a timezone-aware value for
    # TIMESTAMPTZ. Handle a naive value defensively as well.
    if user.locked_until is not None:
        locked_until = user.locked_until

        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)

        if locked_until > now:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Too many failed attempts. Please try again later.",
            )

        # Expired lock: reset the previous failure count.
        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()

    sequence_text = ":".join(request.sequence)

    if not password_hash.verify(
        sequence_text,
        user.sequence_hash,
    ):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= 5:
            user.failed_login_attempts = 5
            user.locked_until = now + timedelta(minutes=15)

        db.commit()

        if user.locked_until is not None:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Too many failed attempts. Please try again in 15 minutes.",
            )

        raise invalid_credentials

    # Successful verification resets the failure count.
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    return {
        "status": "success",
        "message": "Login credentials verified.",
        "username": user.username,
    }
