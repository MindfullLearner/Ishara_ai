
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from typing import Literal
from datetime import datetime


SYMBOL_IDS = {
    "heart",
    "star",
    "moon",
    "sun",
    "flower",
    "lightning",
    "leaf",
    "rainbow",
}


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    sequence: list[str] = Field(min_length=5, max_length=5)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()

        if not re.fullmatch(r"[A-Za-z0-9_]{3,30}", value):
            raise ValueError(
                "Username must contain 3–30 letters, numbers, or underscores."
            )

        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("sequence")
    @classmethod
    def validate_sequence(cls, value: list[str]) -> list[str]:
        if any(symbol not in SYMBOL_IDS for symbol in value):
            raise ValueError("The symbol sequence contains an invalid symbol.")

        return value


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    role: str
    
class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    sequence: list[str] = Field(min_length=5, max_length=5)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()

        if not re.fullmatch(r"[A-Za-z0-9_]{3,30}", value):
            raise ValueError("Invalid username format.")

        return value

    @field_validator("sequence")
    @classmethod
    def validate_sequence(cls, value: list[str]) -> list[str]:
        if any(symbol not in SYMBOL_IDS for symbol in value):
            raise ValueError("The symbol sequence contains an invalid symbol.")

        return value


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None
    email: EmailStr
    role: str
    status: str
    created_at: datetime


class AdminUserUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    role: Literal["user", "admin"]
    status: Literal["active", "pending", "suspended"]

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Full name cannot be empty.")

        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()
    
class AdminUserStatusUpdate(BaseModel):
    status: Literal["active", "pending", "suspended"]