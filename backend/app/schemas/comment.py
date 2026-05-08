from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserOut


class CommentCreate(BaseModel):
    post_id: int
    content: str = Field(min_length=1, max_length=2000)
    parent_id: int | None = None


class CommentOut(BaseModel):
    id: int
    post_id: int
    author_id: int
    content: str
    parent_id: int | None = None
    created_at: datetime
    author: UserOut | None = None
    replies: list["CommentOut"] = []

    model_config = {"from_attributes": True}
