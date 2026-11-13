
import os
import hashlib
import secrets
import smtplib

from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from pwdlib import PasswordHash
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import User
from schemas import (
    SignupRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    UserResponse,
    AdminUserResponse,
    AdminUserUpdate,
    AdminUserStatusUpdate,
)

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing. Check your .env file.")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

password_hash = PasswordHash.recommended()
security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="ISHARA AI API",
    description="Backend API for the ISHARA AI project",
    version="0.2.0",
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def generate_secure_token():
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def send_email(recipient: str, subject: str, body: str):
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        raise RuntimeError("SMTP email configuration is missing.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_EMAIL
    message["To"] = recipient
    message.set_content(body)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_APP_PASSWORD.replace(" ", ""))
        server.send_message(message)


def send_verification_email(user: User, token: str):
    query = urlencode({"token": token})
    verification_link = (
        f"{FRONTEND_URL.rstrip('/')}/verify-email?{query}"
    )

    body = f"""
Hello {user.full_name},

Welcome to ISHARA AI!

Please verify your email address by opening this link:

{verification_link}

This link expires in 24 hours.

If you did not create this account, please ignore this email.
"""

    send_email(
        user.email,
        "Verify your ISHARA AI account",
        body,
    )


def send_password_reset_email(user: User, token: str):
    query = urlencode({"token": token})
    reset_link = (
        f"{FRONTEND_URL.rstrip('/')}/reset-password?{query}"
    )

    body = f"""
Hello {user.full_name},

We received a request to reset your ISHARA AI password.

Open this link to choose a new password:

{reset_link}

This link expires in 30 minutes.

If you did not request a password reset, ignore this email.
"""

    send_email(
        user.email,
        "Reset your ISHARA AI password",
        body,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = int(payload.get("sub"))

    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is not active.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email verification required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Authorize from the active database user, never a client JWT role claim."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return user


def assert_not_last_active_administrator(db: Session, user: User) -> User:
    """Serialize changes to active admins and protect the last one."""
    if user.role != "admin" or user.status != "active":
        return user

    active_admins = (
        db.query(User)
        .filter(User.role == "admin", User.status == "active")
        .order_by(User.id)
        .with_for_update()
        .populate_existing()
        .all()
    )
    locked_user = next(
        (admin for admin in active_admins if admin.id == user.id),
        None,
    )
    if locked_user is None:
        return user
    if len(active_admins) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The last active administrator cannot be demoted, suspended, "
                "or deleted."
            ),
        )
    return locked_user


def is_token_expired(expiry):
    if expiry is None:
        return True

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    return expiry <= datetime.now(timezone.utc)


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


@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == str(request.email).lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered.",
        )

    token, token_hash = generate_secure_token()

    new_user = User(
        full_name=request.full_name,
        email=str(request.email),
        password_hash=password_hash.hash(request.password),
        role="user",
        status="active",
        is_verified=False,
        failed_login_attempts=0,
        verification_token_hash=token_hash,
        verification_token_expires=(
            datetime.now(timezone.utc) + timedelta(hours=24)
        ),
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered.",
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create your account.",
        )

    try:
        send_verification_email(new_user, token)

    except Exception:
        # Keep the account pending so verification can be retried.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Account created, but verification email could not be sent. Please contact support.",
        )

    return {
        "status": "success",
        "message": "Account created. Please check your email to verify your account.",
    }


@app.post("/api/auth/verify-email")
def verify_email(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    token_hash = hash_token(request.token)

    user = (
        db.query(User)
        .filter(User.verification_token_hash == token_hash)
        .first()
    )

    if user is None or is_token_expired(user.verification_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link.",
        )

    user.is_verified = True
    user.verification_token_hash = None
    user.verification_token_expires = None

    db.commit()

    return {
        "status": "success",
        "message": "Email verified successfully.",
    }


@app.post("/api/auth/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == str(request.email).lower())
        .first()
    )

    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )

    if user is None:
        raise invalid_credentials

    now = datetime.now(timezone.utc)

    if user.locked_until is not None:
        locked_until = user.locked_until

        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)

        if locked_until > now:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Too many failed attempts. Please try again later.",
            )

        user.locked_until = None
        user.failed_login_attempts = 0
        db.commit()

    if user.password_hash is None or not password_hash.verify(request.password, user.password_hash):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= 3:
            user.failed_login_attempts = 3
            user.locked_until = now + timedelta(minutes=15)

        db.commit()

        if user.locked_until is not None:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Too many failed attempts. Please try again in 15 minutes.",
            )

        raise invalid_credentials

    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending administrator approval.",
        )

    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is suspended. Please contact the administrator.",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in.",
        )

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    access_token = create_access_token(user.id)

    return {
        "status": "success",
        "message": "Login successful.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.post("/api/auth/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    generic_response = {
        "status": "success",
        "message": "If an account exists with this email, a password reset link will be sent.",
    }

    user = (
        db.query(User)
        .filter(func.lower(User.email) == str(request.email).lower())
        .first()
    )

    if user is None or (not user.is_verified and user.password_hash is not None):
        return generic_response

    token, token_hash = generate_secure_token()

    user.reset_token_hash = token_hash
    user.reset_token_expires = (
        datetime.now(timezone.utc) + timedelta(minutes=30)
    )

    db.commit()

    try:
        send_password_reset_email(user, token)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the password reset email right now.",
        )

    return generic_response


@app.post("/api/auth/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    token_hash = hash_token(request.token)

    user = (
        db.query(User)
        .filter(User.reset_token_hash == token_hash)
        .first()
    )

    if user is None or is_token_expired(user.reset_token_expires):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link.",
        )

    user.password_hash = password_hash.hash(request.new_password)
    user.is_verified = True
    user.reset_token_hash = None
    user.reset_token_expires = None
    user.failed_login_attempts = 0
    user.locked_until = None

    db.commit()

    return {
        "status": "success",
        "message": "Password reset successfully. You can now sign in.",
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(
    user: User = Depends(get_current_user),
):
    return user


@app.get("/api/admin/test")
def admin_access_test(
    admin: User = Depends(require_admin),
):
    return {"status": "success", "message": "Admin access verified."}


@app.get("/api/admin/users", response_model=list[AdminUserResponse])
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.created_at.desc(), User.id.desc()).all()


@app.get("/api/admin/users/{user_id}", response_model=AdminUserResponse)
def get_admin_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user


@app.put("/api/admin/users/{user_id}", response_model=AdminUserResponse)
def update_admin_user(
    user_id: int,
    request: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.id == admin.id and (
        request.role != "admin" or request.status != "active"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove admin access or suspend your own account.",
        )

    removes_active_admin_access = (
        user.role == "admin"
        and user.status == "active"
        and (request.role != "admin" or request.status != "active")
    )
    if removes_active_admin_access:
        user = assert_not_last_active_administrator(db, user)

    duplicate_email = (
        db.query(User)
        .filter(
            func.lower(User.email) == str(request.email).lower(),
            User.id != user_id,
        )
        .first()
    )
    if duplicate_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That email address is already in use.",
        )

    user.full_name = request.full_name
    user.email = str(request.email)
    user.role = request.role
    user.status = request.status

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The user update conflicts with existing data.",
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update user.",
        )
    return user


@app.patch(
    "/api/admin/users/{user_id}/status",
    response_model=AdminUserResponse,
)
def update_admin_user_status(
    user_id: int,
    request: AdminUserStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.id == admin.id and request.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot suspend your own account.",
        )

    if (
        user.role == "admin"
        and user.status == "active"
        and request.status != "active"
    ):
        user = assert_not_last_active_administrator(db, user)

    user.status = request.status
    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update account status.",
        )
    return user


@app.delete(
    "/api/admin/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_admin_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    user = assert_not_last_active_administrator(db, user)
    try:
        db.delete(user)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete user.",
        )

@app.get("/api/admin/dashboard/summary")
def get_admin_dashboard_summary(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users = (
        db.query(func.count(User.id))
        .scalar()
    )

    active_users = (
        db.query(func.count(User.id))
        .filter(User.status == "active")
        .scalar()
    )

    pending_users = (
        db.query(func.count(User.id))
        .filter(User.status == "pending")
        .scalar()
    )

    suspended_users = (
        db.query(func.count(User.id))
        .filter(User.status == "suspended")
        .scalar()
    )

    admin_users = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "pending_users": pending_users,
        "suspended_users": suspended_users,
        "admin_users": admin_users,
        "translations": None,
        "active_today": None,
    }
