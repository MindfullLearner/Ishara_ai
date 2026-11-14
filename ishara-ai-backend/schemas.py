
import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter.")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain a number.")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter.")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain a number.")
        return value


class VerifyEmailRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: str
    is_verified: bool


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: Literal["user", "admin"]
    status: Literal["active", "pending", "suspended"]
    is_verified: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role: Literal["user", "admin"]
    status: Literal["active", "pending", "suspended"]

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class AdminUserStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["active", "pending", "suspended"]

class AdminUserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    role: Literal["user", "admin"]
    status: Literal["active", "pending"]

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Full name must contain at least 2 characters.")

        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()
    
class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter.")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain a number.")
        return value
class SystemLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    severity: Literal["INFO", "WARN", "ERROR", "CRITICAL"]
    event: str
    source: str
    request_id: str | None
    details: str
    timestamp: datetime

# ==============================
# PSL Dictionary Schemas
# ==============================

class PSLDictionaryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    word: str = Field(min_length=1, max_length=150)
    description: str | None = None
    category: str = Field(min_length=1, max_length=100)
    video_url: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)
    status: Literal["draft", "reviewed"] = "draft"

    @field_validator("word", "category")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return value.strip() if value else value


class PSLDictionaryUpdate(PSLDictionaryCreate):
    pass
    status: Literal["draft", "reviewed"]


class PSLDictionaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    word: str
    description: str | None
    category: str
    video_url: str | None
    image_url: str | None
    created_at: datetime
    updated_at: datetime
    status: Literal["draft", "reviewed"] = "draft"


# ==============================
# Knowledge Base Schemas
# ==============================

class KnowledgeArticleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=100)
    status: Literal["draft", "published"] = "draft"

    @field_validator("title", "category")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty.")
        return value

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Article content cannot be empty.")
        return value


class KnowledgeArticleUpdate(KnowledgeArticleCreate):
    pass


class KnowledgeArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    category: str
    author_id: int | None
    status: Literal["draft", "published"]
    created_at: datetime
    updated_at: datetime

# ==============================
# Processing Activity Schemas
# ==============================

class ProcessingActivityCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    input_source: Literal["camera", "upload"]
    clip_duration_seconds: int | None = Field(default=None, ge=0)


class ProcessingActivityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["pending", "processing", "completed", "failed"]
    processing_time_seconds: float | None = Field(default=None, ge=0)
    error_message: str | None = None


class ProcessingActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    request_id: str
    user_id: int | None
    input_source: Literal["camera", "upload"]
    output_type: str
    status: Literal["pending", "processing", "completed", "failed"]
    clip_duration_seconds: int | None
    processing_time_seconds: float | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None
