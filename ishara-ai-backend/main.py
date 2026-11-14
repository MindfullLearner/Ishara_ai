import os
import hashlib
import secrets
import smtplib

from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import jwt
from dotenv import load_dotenv
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    UploadFile,
    File,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pwdlib import PasswordHash
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from pathlib import Path
from uuid import uuid4
from database import SessionLocal, engine
from models import (
    User,
    SystemLog,
    PSLDictionary,
    KnowledgeArticle,
    ProcessingActivity,
    Base,
)
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
    AdminUserCreate,
    ProfileUpdateRequest,
    ChangePasswordRequest,
    SystemLogResponse,
    PSLDictionaryCreate,
    PSLDictionaryUpdate,
    PSLDictionaryResponse,
    KnowledgeArticleCreate,
    KnowledgeArticleUpdate,
    KnowledgeArticleResponse,
    ProcessingActivityCreate,
    ProcessingActivityUpdate,
    ProcessingActivityResponse,
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
# ==========================================
# MEDIA UPLOAD CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"
VIDEO_DIR = UPLOAD_DIR / "videos"
IMAGE_DIR = UPLOAD_DIR / "images"

VIDEO_DIR.mkdir(parents=True, exist_ok=True)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
# Create any missing database tables
Base.metadata.create_all(bind=engine)

# Serve uploaded media files
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
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

def record_system_log(
    db: Session,
    severity: str,
    event: str,
    source: str,
    details: str,
    request_id: str | None = None,
):
    """Save a system event without interrupting the main application."""
    try:
        log = SystemLog(
            severity=severity,
            event=event,
            source=source,
            request_id=request_id,
            details=details,
        )

        db.add(log)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        # Logging failure should not interrupt the main application.

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

def send_admin_invitation_email(user: User, token: str):
    query = urlencode({"token": token})
    invitation_link = (
        f"{FRONTEND_URL.rstrip('/')}/reset-password?{query}"
    )

    body = f"""
Hello {user.full_name},

An administrator has created an ISHARA AI account for you.

Please open the following link to set your password:

{invitation_link}

This invitation link expires in 24 hours.

If you were not expecting this invitation, please ignore this email.
"""

    send_email(
        user.email,
        "Your ISHARA AI account invitation",
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

    if user.password_hash is None or not password_hash.verify(
        request.password, user.password_hash
    ):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= 3:
            user.failed_login_attempts = 3
            user.locked_until = now + timedelta(minutes=15)

        db.commit()

        record_system_log(
            db=db,
            severity="WARN",
            event="Failed login attempt",
            source="auth.login",
            details=f"Failed login attempt for User ID {user.id}.",
        )

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

    record_system_log(
        db=db,
        severity="INFO",
        event="User login successful",
        source="auth.login",
        details=f"User ID {user.id} logged in successfully.",
    )

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

@app.put("/api/auth/me", response_model=UserResponse)
def update_my_profile(
    request: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_email = str(request.email).lower()
    email_changed = new_email != user.email.lower()

    if email_changed:
        duplicate_email = (
            db.query(User)
            .filter(
                func.lower(User.email) == new_email,
                User.id != user.id,
            )
            .first()
        )

        if duplicate_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email address is already in use.",
            )

        # Require verification of the new email address.
        token, token_hash = generate_secure_token()

        user.full_name = request.full_name
        user.email = new_email
        user.is_verified = False
        user.verification_token_hash = token_hash
        user.verification_token_expires = (
            datetime.now(timezone.utc) + timedelta(hours=24)
        )

        try:
            send_verification_email(user, token)
            db.commit()
            db.refresh(user)

        except HTTPException:
            db.rollback()
            raise

        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to send verification email. Profile was not changed.",
            )

        return user

    user.full_name = request.full_name

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already in use.",
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update your profile.",
        )

    return user
@app.patch("/api/auth/me/password")
def change_my_password(
    request: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change is not available for this account.",
        )

    if not password_hash.verify(
        request.current_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    if password_hash.verify(
        request.new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    user.password_hash = password_hash.hash(request.new_password)

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to change your password.",
        )

    return {
        "status": "success",
        "message": "Password changed successfully.",
    }

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

@app.post(
    "/api/admin/users",
    response_model=AdminUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_user(
    request: AdminUserCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Check whether the email is already registered.
    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == str(request.email).lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already registered.",
        )

    # Generate a secure password-setup token.
    token, token_hash = generate_secure_token()

    new_user = User(
        full_name=request.full_name,
        email=str(request.email).lower(),
        password_hash=None,
        role=request.role,
        status=request.status,
        is_verified=False,
        failed_login_attempts=0,
        reset_token_hash=token_hash,
        reset_token_expires=(
            datetime.now(timezone.utc) + timedelta(hours=24)
        ),
    )

    try:
        db.add(new_user)
        db.flush()

        # Send the invitation before committing the new account.
        send_admin_invitation_email(new_user, token)

        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already registered.",
        )

    except Exception as error:
        db.rollback()
        print("ADMIN CREATE USER ERROR:", repr(error))

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create the user or send the invitation email. Please try again.",
        )

    # Record the successful invitation.
    record_system_log(
        db=db,
        severity="INFO",
        event="User invitation sent",
        source="admin.users.create",
        details=(
            f"Admin ID {admin.id} invited User ID {new_user.id}."
        ),
    )

    return new_user

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

    record_system_log(
        db=db,
        severity="INFO",
        event="User details updated",
        source="admin.users.update",
        details=f"Admin ID {admin.id} updated User ID {user.id}.",
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

    # Save the previous status before changing it.
    old_status = user.status
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

    if old_status != user.status:
        record_system_log(
            db=db,
            severity="WARN",
            event="User account status changed",
            source="admin.users.status",
            details=(
                f"Admin ID {admin.id} changed User ID {user.id} "
                f"status from {old_status} to {user.status}."
            ),
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

    # Save the ID before deleting the user.
    deleted_user_id = user.id

    try:
        db.delete(user)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete user.",
        )

    # Record the deletion after successful database commit.
    record_system_log(
        db=db,
        severity="WARN",
        event="User account deleted",
        source="admin.users.delete",
        details=f"Admin ID {admin.id} deleted User ID {deleted_user_id}.",
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

# ==========================================
# PSL DICTIONARY ADMIN APIs
# ==========================================

@app.post(
    "/api/admin/psl-dictionary",
    response_model=PSLDictionaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_psl_sign(
    request: PSLDictionaryCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    new_sign = PSLDictionary(
        word=request.word,
        description=request.description,
        category=request.category,
        video_url=request.video_url,
        image_url=request.image_url,
        status=request.status,
    )

    try:
        db.add(new_sign)
        db.commit()
        db.refresh(new_sign)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create PSL dictionary entry.",
        )

    record_system_log(
        db=db,
        severity="INFO",
        event="PSL dictionary entry created",
        source="admin.psl_dictionary.create",
        details=f"Admin ID {admin.id} created sign ID {new_sign.id}.",
    )

    return new_sign


@app.get(
    "/api/admin/psl-dictionary",
    response_model=list[PSLDictionaryResponse],
)
def list_psl_signs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(PSLDictionary)
        .order_by(PSLDictionary.created_at.desc(), PSLDictionary.id.desc())
        .all()
    )


@app.get(
    "/api/admin/psl-dictionary/{sign_id}",
    response_model=PSLDictionaryResponse,
)
def get_psl_sign(
    sign_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sign = (
        db.query(PSLDictionary)
        .filter(PSLDictionary.id == sign_id)
        .first()
    )

    if sign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PSL dictionary entry not found.",
        )

    return sign


@app.put(
    "/api/admin/psl-dictionary/{sign_id}",
    response_model=PSLDictionaryResponse,
)
def update_psl_sign(
    sign_id: int,
    request: PSLDictionaryUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sign = (
        db.query(PSLDictionary)
        .filter(PSLDictionary.id == sign_id)
        .first()
    )

    if sign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PSL dictionary entry not found.",
        )

    sign.word = request.word
    sign.description = request.description
    sign.category = request.category
    sign.video_url = request.video_url
    sign.image_url = request.image_url
    sign.status = request.status

    try:
        db.commit()
        db.refresh(sign)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update PSL dictionary entry.",
        )

    record_system_log(
        db=db,
        severity="INFO",
        event="PSL dictionary entry updated",
        source="admin.psl_dictionary.update",
        details=f"Admin ID {admin.id} updated sign ID {sign.id}.",
    )

    return sign
# ==========================================
# PSL DICTIONARY MEDIA UPLOAD
# ==========================================

@app.post(
    "/api/admin/psl-dictionary/{sign_id}/media",
    response_model=PSLDictionaryResponse,
)
async def upload_psl_sign_media(
    sign_id: int,
    media_type: str,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Find the PSL sign
    sign = db.query(PSLDictionary).filter(
        PSLDictionary.id == sign_id
    ).first()

    if not sign:
        raise HTTPException(
            status_code=404,
            detail="PSL sign not found.",
        )

    # Validate media type
    if media_type not in ["video", "image"]:
        raise HTTPException(
            status_code=400,
            detail="Media type must be video or image.",
        )

    # Allowed file types and size limits
    if media_type == "video":
        allowed_extensions = {".mp4", ".webm", ".mov"}
        allowed_content_types = {
            "video/mp4",
            "video/webm",
            "video/quicktime",
        }
        max_size = 50 * 1024 * 1024  # 50 MB
        target_dir = VIDEO_DIR
    else:
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        allowed_content_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }
        max_size = 5 * 1024 * 1024  # 5 MB
        target_dir = IMAGE_DIR

    extension = Path(file.filename or "").suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file extension.",
        )

    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file content type.",
        )

    # Save file with a unique name
    filename = f"{uuid4().hex}{extension}"
    file_path = target_dir / filename
    file_size = 0

    try:
        with file_path.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)

                if file_size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail="File is too large.",
                    )

                buffer.write(chunk)

        media_url = f"/uploads/{media_type}s/{filename}"

        if media_type == "video":
            sign.video_url = media_url
        else:
            sign.image_url = media_url

        db.commit()
        db.refresh(sign)

        record_system_log(
            db,
            severity="INFO",
            event=f"PSL sign {media_type} uploaded",
            source="admin.psl_dictionary.media",
            details=f"{media_type.title()} uploaded for PSL sign ID {sign_id}.",
        )

        return sign

    except HTTPException:
        if file_path.exists():
            file_path.unlink()
        raise

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Media upload failed.",
        )

    finally:
        await file.close()

@app.delete(
    "/api/admin/psl-dictionary/{sign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_psl_sign(
    sign_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sign = (
        db.query(PSLDictionary)
        .filter(PSLDictionary.id == sign_id)
        .first()
    )

    if sign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PSL dictionary entry not found.",
        )

    deleted_sign_id = sign.id

    try:
        db.delete(sign)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete PSL dictionary entry.",
        )

    record_system_log(
        db=db,
        severity="WARN",
        event="PSL dictionary entry deleted",
        source="admin.psl_dictionary.delete",
        details=f"Admin ID {admin.id} deleted sign ID {deleted_sign_id}.",
    )


@app.post(
    "/api/admin/knowledge-base",
    response_model=KnowledgeArticleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_knowledge_article(
    request: KnowledgeArticleCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    new_article = KnowledgeArticle(
        title=request.title,
        content=request.content,
        category=request.category,
        status=request.status,
        author_id=admin.id,
    )

    try:
        db.add(new_article)
        db.commit()
        db.refresh(new_article)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create knowledge base article.",
        )

    record_system_log(
        db=db,
        severity="INFO",
        event="Knowledge base article created",
        source="admin.knowledge_base.create",
        details=f"Admin ID {admin.id} created article ID {new_article.id}.",
    )

    return new_article


@app.get(
    "/api/admin/knowledge-base",
    response_model=list[KnowledgeArticleResponse],
)
def list_knowledge_articles(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(KnowledgeArticle)
        .order_by(
            KnowledgeArticle.created_at.desc(),
            KnowledgeArticle.id.desc(),
        )
        .all()
    )


@app.get(
    "/api/admin/knowledge-base/{article_id}",
    response_model=KnowledgeArticleResponse,
)
def get_knowledge_article(
    article_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    article = (
        db.query(KnowledgeArticle)
        .filter(KnowledgeArticle.id == article_id)
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base article not found.",
        )

    return article


@app.put(
    "/api/admin/knowledge-base/{article_id}",
    response_model=KnowledgeArticleResponse,
)
def update_knowledge_article(
    article_id: int,
    request: KnowledgeArticleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    article = (
        db.query(KnowledgeArticle)
        .filter(KnowledgeArticle.id == article_id)
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base article not found.",
        )

    article.title = request.title
    article.content = request.content
    article.category = request.category
    article.status = request.status

    try:
        db.commit()
        db.refresh(article)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update knowledge base article.",
        )

    record_system_log(
        db=db,
        severity="INFO",
        event="Knowledge base article updated",
        source="admin.knowledge_base.update",
        details=f"Admin ID {admin.id} updated article ID {article.id}.",
    )

    return article


@app.delete(
    "/api/admin/knowledge-base/{article_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_knowledge_article(
    article_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    article = (
        db.query(KnowledgeArticle)
        .filter(KnowledgeArticle.id == article_id)
        .first()
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="Knowledge base article not found.",
        )

    deleted_article_id = article.id

    try:
        db.delete(article)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete knowledge base article.",
        )

    record_system_log(
        db=db,
        severity="WARN",
        event="Knowledge base article deleted",
        source="admin.knowledge_base.delete",
        details=f"Admin ID {admin.id} deleted article ID {deleted_article_id}.",
    )

@app.get(
    "/api/admin/system-logs",
    response_model=list[SystemLogResponse],
)
def get_system_logs(
    limit: int = Query(default=500, ge=1, le=1000),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(SystemLog)
        .order_by(SystemLog.timestamp.desc(), SystemLog.id.desc())
        .limit(limit)
        .all()
    )

    return logs

# ==========================================
# PSL DICTIONARY MEDIA UPLOAD
# ==========================================

@app.post(
    "/api/admin/psl-dictionary/{sign_id}/media",
    response_model=PSLDictionaryResponse,
)
async def upload_psl_sign_media(
    sign_id: int,
    media_type: str,
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Find the PSL sign
    sign = db.query(PSLDictionary).filter(
        PSLDictionary.id == sign_id
    ).first()

    if not sign:
        raise HTTPException(
            status_code=404,
            detail="PSL sign not found.",
        )

    # Validate media type
    if media_type not in ["video", "image"]:
        raise HTTPException(
            status_code=400,
            detail="Media type must be video or image.",
        )

    # Allowed file types and size limits
    if media_type == "video":
        allowed_extensions = {".mp4", ".webm", ".mov"}
        allowed_content_types = {
            "video/mp4",
            "video/webm",
            "video/quicktime",
        }
        max_size = 50 * 1024 * 1024  # 50 MB
        target_dir = VIDEO_DIR
    else:
        allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
        allowed_content_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }
        max_size = 5 * 1024 * 1024  # 5 MB
        target_dir = IMAGE_DIR

    extension = Path(file.filename or "").suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file extension.",
        )

    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file content type.",
        )

    # Save file with a unique name
    filename = f"{uuid4().hex}{extension}"
    file_path = target_dir / filename
    file_size = 0

    try:
        with file_path.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)

                if file_size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail="File is too large.",
                    )

                buffer.write(chunk)

        media_url = f"/uploads/{media_type}s/{filename}"

        if media_type == "video":
            sign.video_url = media_url
        else:
            sign.image_url = media_url

        db.commit()
        db.refresh(sign)

        record_system_log(
            db,
            severity="INFO",
            event=f"PSL sign {media_type} uploaded",
            source="admin.psl_dictionary.media",
            details=f"{media_type.title()} uploaded for PSL sign ID {sign_id}.",
        )

        return sign

    except HTTPException:
        if file_path.exists():
            file_path.unlink()
        raise

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="Media upload failed.",
        )

    finally:
        await file.close()


# ==========================================
# PROCESSING ACTIVITY APIs
# ==========================================

@app.post(
    "/api/processing-activity",
    response_model=ProcessingActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_processing_activity(
    request: ProcessingActivityCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    request_id = f"REQ-{datetime.now(timezone.utc).year}-{uuid4().hex[:8].upper()}"

    new_activity = ProcessingActivity(
        request_id=request_id,
        user_id=user.id,
        input_source=request.input_source,
        output_type="psl_avatar_video",
        status="pending",
        clip_duration_seconds=request.clip_duration_seconds,
    )

    try:
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create processing activity.",
        )

    record_system_log(
        db=db,
        severity="INFO",
        event="PSL processing request created",
        source="processing.create",
        request_id=request_id,
        details=f"User ID {user.id} submitted a PSL processing request.",
    )

    return new_activity


@app.get(
    "/api/admin/processing-activity",
    response_model=list[ProcessingActivityResponse],
)
def list_processing_activities(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return (
        db.query(ProcessingActivity)
        .order_by(
            ProcessingActivity.created_at.desc(),
            ProcessingActivity.id.desc(),
        )
        .all()
    )


@app.get(
    "/api/admin/processing-activity/{activity_id}",
    response_model=ProcessingActivityResponse,
)
def get_processing_activity(
    activity_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    activity = (
        db.query(ProcessingActivity)
        .filter(ProcessingActivity.id == activity_id)
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Processing activity not found.",
        )

    return activity


@app.patch(
    "/api/admin/processing-activity/{activity_id}",
    response_model=ProcessingActivityResponse,
)
def update_processing_activity(
    activity_id: int,
    request: ProcessingActivityUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    activity = (
        db.query(ProcessingActivity)
        .filter(ProcessingActivity.id == activity_id)
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Processing activity not found.",
        )

    activity.status = request.status
    activity.processing_time_seconds = request.processing_time_seconds
    activity.error_message = request.error_message

    if request.status in ["completed", "failed"]:
        activity.completed_at = datetime.now(timezone.utc)
    else:
        activity.completed_at = None

    try:
        db.commit()
        db.refresh(activity)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update processing activity.",
        )

    record_system_log(
        db=db,
        severity="INFO" if request.status != "failed" else "ERROR",
        event="PSL processing status updated",
        source="processing.update",
        request_id=activity.request_id,
        details=(
            f"Admin ID {admin.id} updated request "
            f"{activity.request_id} to {activity.status}."
        ),
    )

    return activity
