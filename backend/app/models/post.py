import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PostStatus(str, enum.Enum):
    published = "published"
    hidden = "hidden"
    deleted = "deleted"


class InteractionType(str, enum.Enum):
    like = "like"
    favorite = "favorite"
    repost = "repost"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    section_id: Mapped[int] = mapped_column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.published)
    is_pinned: Mapped[bool] = mapped_column(default=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User", back_populates="posts", lazy="selectin")
    section = relationship("Section", back_populates="posts", lazy="selectin")
    comments = relationship("Comment", back_populates="post", lazy="selectin", cascade="all, delete-orphan")
    interactions = relationship("PostInteraction", back_populates="post", lazy="selectin", cascade="all, delete-orphan")


class PostInteraction(Base):
    __tablename__ = "post_interactions"
    __table_args__ = (UniqueConstraint("user_id", "post_id", "type", name="uq_user_post_interaction"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("posts.id"), nullable=False)
    type: Mapped[InteractionType] = mapped_column(Enum(InteractionType), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="interactions")
