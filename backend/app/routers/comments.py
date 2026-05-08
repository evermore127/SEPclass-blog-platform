from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


@router.get("/")
async def list_comments(post_id: int = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author), selectinload(Comment.replies).selectinload(Comment.author))
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None))
        .order_by(desc(Comment.created_at))
    )
    comments = result.scalars().all()
    return resp(data=[CommentOut.model_validate(c).model_dump() for c in comments])


@router.post("/")
async def create_comment(body: CommentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = Comment(
        post_id=body.post_id,
        author_id=current_user.id,
        content=body.content,
        parent_id=body.parent_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    # reload with relationships
    result = await db.execute(
        select(Comment).options(selectinload(Comment.author)).where(Comment.id == comment.id)
    )
    comment = result.scalar_one()
    return resp(data=CommentOut.model_validate(comment).model_dump())


@router.delete("/{comment_id}")
async def delete_comment(comment_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        return resp(code=404, msg="Comment not found")
    if comment.author_id != current_user.id and current_user.role not in ("moderator", "admin"):
        return resp(code=403, msg="Not allowed")

    await db.delete(comment)
    await db.commit()
    return resp(msg="Comment deleted")
