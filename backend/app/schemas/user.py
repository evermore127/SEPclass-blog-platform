from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    bio: str | None = Field(None, max_length=500)
    current_password: str | None = Field(None, min_length=6, max_length=128)
    new_password: str | None = Field(None, min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: str | None = None
    bio: str | None = None
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
