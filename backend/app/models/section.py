import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SectionStatus(str, enum.Enum):
    active = "active"
    archived = "archived"


class SectionModuleType(str, enum.Enum):
    post = "post"
    announcement = "announcement"


class SectionAppType(str, enum.Enum):
    primary = "primary"
    secondary = "secondary"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Section(Base):
    __tablename__ = "sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("sections.id"), nullable=True)
    creator_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[SectionStatus] = mapped_column(Enum(SectionStatus), default=SectionStatus.active)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    parent = relationship("Section", remote_side="Section.id", backref="children", lazy="selectin")
    modules = relationship("SectionModule", back_populates="section", lazy="selectin", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="section", lazy="selectin")


class SectionModule(Base):
    __tablename__ = "section_modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    section_id: Mapped[int] = mapped_column(Integer, ForeignKey("sections.id"), nullable=False)
    module_type: Mapped[SectionModuleType] = mapped_column(Enum(SectionModuleType), nullable=False)

    section = relationship("Section", back_populates="modules")


class SectionApplication(Base):
    __tablename__ = "section_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    applicant_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    app_type: Mapped[SectionAppType] = mapped_column(Enum(SectionAppType), nullable=False)
    parent_section_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("sections.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus), default=ApplicationStatus.pending)
    reviewer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
