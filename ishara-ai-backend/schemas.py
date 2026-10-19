
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


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
