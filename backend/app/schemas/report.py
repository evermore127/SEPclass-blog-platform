from datetime import datetime

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    target_type: str = Field(pattern="^(post|comment|user)$")
    target_id: int
    reason: str = Field(min_length=1, max_length=1000)


class ReportOut(BaseModel):
    id: int
    reporter_id: int
    target_type: str
    target_id: int
    reason: str
    status: str
    reviewer_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
