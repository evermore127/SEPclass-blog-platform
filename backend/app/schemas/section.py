from datetime import datetime

from pydantic import BaseModel, Field


class SectionModuleOut(BaseModel):
    id: int
    section_id: int
    module_type: str

    model_config = {"from_attributes": True}


class SectionOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    parent_id: int | None = None
    creator_id: int
    status: str
    created_at: datetime
    children: list["SectionOut"] = []
    modules: list[SectionModuleOut] = []

    model_config = {"from_attributes": True}


class SectionApply(BaseModel):
    app_type: str = Field(pattern="^(primary|secondary)$")
    parent_section_id: int | None = None
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(None, max_length=500)
    reason: str | None = Field(None, max_length=1000)


class SectionApplicationOut(BaseModel):
    id: int
    applicant_id: int
    app_type: str
    parent_section_id: int | None = None
    name: str
    description: str | None = None
    reason: str | None = None
    status: str
    reviewer_id: int | None = None
    reviewed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
