from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc, delete, and_, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.post import Post, PostInteraction, InteractionType, PostStatus
from app.models.user import User
from app.schemas.post import PostCreate, PostUpdate, PostOut, PostListOut

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


async def _post_to_out(db: AsyncSession, post: Post) -> dict:
    like_count = await db.scalar(
        select(func.count()).where(and_(PostInteraction.post_id == post.id, PostInteraction.type == InteractionType.like))
    ) or 0
    favorite_count = await db.scalar(
        select(func.count()).where(and_(PostInteraction.post_id == post.id, PostInteraction.type == InteractionType.favorite))
    ) or 0
    from app.models.comment import Comment
    comment_count = await db.scalar(
        select(func.count()).where(Comment.post_id == post.id)
    ) or 0

    data = PostOut.model_validate(post).model_dump()
    data["like_count"] = like_count
    data["favorite_count"] = favorite_count
    data["comment_count"] = comment_count
    return data


@router.get("/")
async def list_posts(
    section_id: int | None = Query(None),
    search: str | None = Query(None),
    sort: str = Query("time", regex="^(time|likes|favorites)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Post).options(selectinload(Post.author)).where(Post.status == PostStatus.published)
    count_query = select(func.count()).where(Post.status == PostStatus.published)

    if section_id:
        query = query.where(Post.section_id == section_id)
        count_query = count_query.where(Post.section_id == section_id)

    if search:
        like_pattern = f"%{search}%"
        query = query.where(Post.title.ilike(like_pattern))
        count_query = count_query.where(Post.title.ilike(like_pattern))

    if sort == "likes":
        likes_subq = (
            select(PostInteraction.post_id, func.count().label("cnt"))
            .where(PostInteraction.type == InteractionType.like)
            .group_by(PostInteraction.post_id)
            .subquery()
        )
        query = query.outerjoin(likes_subq, Post.id == likes_subq.c.post_id).order_by(
            desc(Post.is_pinned), desc(likes_subq.c.cnt).nulls_last()
        )
    elif sort == "favorites":
        fav_subq = (
            select(PostInteraction.post_id, func.count().label("cnt"))
            .where(PostInteraction.type == InteractionType.favorite)
            .group_by(PostInteraction.post_id)
            .subquery()
        )
        query = query.outerjoin(fav_subq, Post.id == fav_subq.c.post_id).order_by(
            desc(Post.is_pinned), desc(fav_subq.c.cnt).nulls_last()
        )
    else:
        query = query.order_by(desc(Post.is_pinned), desc(Post.created_at))

    total = await db.scalar(count_query) or 0
    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    items = [await _post_to_out(db, p) for p in posts]
    return resp(data=PostListOut(items=items, total=total, page=page, limit=limit).model_dump())


@router.post("/")
async def create_post(body: PostCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = Post(
        title=body.title,
        content=body.content,
        cover_image=body.cover_image,
        author_id=current_user.id,
        section_id=body.section_id,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return resp(data=PostOut.model_validate(post).model_dump())


@router.get("/{post_id}")
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Post).options(selectinload(Post.author)).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post or post.status == PostStatus.deleted:
        return resp(code=404, msg="Post not found")

    data = await _post_to_out(db, post)

    # increment view_count after serialization to avoid ORM state issues
    await db.execute(sa_update(Post).where(Post.id == post_id).values(view_count=Post.view_count + 1))
    await db.commit()
    return resp(data=data)


@router.put("/{post_id}")
async def update_post(post_id: int, body: PostUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        return resp(code=404, msg="Post not found")
    if post.author_id != current_user.id and current_user.role not in ("moderator", "admin"):
        return resp(code=403, msg="Not allowed")

    for key, value in body.model_dump(exclude_none=True).items():
        setattr(post, key, value)
    await db.commit()
    await db.refresh(post)
    return resp(data=PostOut.model_validate(post).model_dump())


@router.delete("/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        return resp(code=404, msg="Post not found")
    if post.author_id != current_user.id and current_user.role not in ("moderator", "admin"):
        return resp(code=403, msg="Not allowed")

    post.status = PostStatus.deleted
    await db.commit()
    return resp(msg="Post deleted")


@router.post("/{post_id}/like")
async def toggle_like(post_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await _toggle_interaction(db, post_id, current_user.id, InteractionType.like)


@router.post("/{post_id}/favorite")
async def toggle_favorite(post_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await _toggle_interaction(db, post_id, current_user.id, InteractionType.favorite)


async def _toggle_interaction(db: AsyncSession, post_id: int, user_id: int, itype: InteractionType):
    result = await db.execute(
        select(PostInteraction).where(
            PostInteraction.post_id == post_id,
            PostInteraction.user_id == user_id,
            PostInteraction.type == itype,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()
        return resp(msg=f"{itype.value} removed", data={"liked": False})
    else:
        interaction = PostInteraction(post_id=post_id, user_id=user_id, type=itype)
        db.add(interaction)
        await db.commit()
        return resp(msg=f"{itype.value} added", data={"liked": True})
