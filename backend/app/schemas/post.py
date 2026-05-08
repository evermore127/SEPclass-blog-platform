from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserOut


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    cover_image: str | None = None
    section_id: int


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = None
    cover_image: str | None = None
    section_id: int | None = None


class PostOut(BaseModel):
    id: int
    title: str
    content: str
    cover_image: str | None = None
    author_id: int
    section_id: int
    status: str
    is_pinned: bool
    view_count: int
    created_at: datetime
    updated_at: datetime
    author: UserOut | None = None
    like_count: int = 0
    favorite_count: int = 0
    comment_count: int = 0

    model_config = {"from_attributes": True}


class PostListOut(BaseModel):
    items: list[PostOut]
    total: int
    page: int
    limit: int
