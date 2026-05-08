import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.audit_log import AuditLog
from app.models.post import Post
from app.models.report import Report
from app.models.section import Section, SectionModule, SectionModuleType, SectionApplication
from app.models.user import User, UserRole
from app.schemas.section import SectionApplicationOut
from app.schemas.report import ReportOut
from app.services.audit_service import create_audit_log

from app.schemas.post import PostOut, PostListOut

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


@router.get("/posts")
async def list_all_posts(page: int = 1, limit: int = 100, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    from sqlalchemy import func, desc as _desc
    query = select(Post).options(selectinload(Post.author)).order_by(_desc(Post.created_at))
    count_q = select(func.count()).select_from(Post)
    total = await db.scalar(count_q) or 0
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    posts = result.scalars().all()
    items = [PostOut.model_validate(p).model_dump() for p in posts]
    return resp(data=PostListOut(items=items, total=total, page=page, limit=limit).model_dump())


@router.get("/reports")
async def list_reports(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(
        select(Report).where(Report.status == "pending").order_by(desc(Report.created_at))
    )
    reports = result.scalars().all()
    return resp(data=[ReportOut.model_validate(r).model_dump() for r in reports])


@router.post("/reports/{report_id}/resolve")
async def resolve_report(report_id: int, action: str = "resolve", db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        return resp(code=404, msg="Report not found")

    report.status = "resolved" if action == "resolve" else "dismissed"
    report.reviewer_id = admin.id

    await create_audit_log(db, admin.id, "resolve_report", "report", report_id)
    await db.commit()
    return resp(msg="Report resolved")


@router.post("/posts/{post_id}/pin")
async def toggle_pin(post_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        return resp(code=404, msg="Post not found")

    post.is_pinned = not post.is_pinned
    await create_audit_log(db, admin.id, "toggle_pin", "post", post_id, {"is_pinned": post.is_pinned})
    await db.commit()
    return resp(data={"is_pinned": post.is_pinned})


@router.post("/posts/{post_id}/hide")
async def hide_post(post_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        return resp(code=404, msg="Post not found")

    post.status = "published" if post.status == "hidden" else "hidden"
    await create_audit_log(db, admin.id, "toggle_hide", "post", post_id, {"status": post.status})
    await db.commit()
    return resp(msg=f"Post {post.status}")


@router.get("/applications")
async def list_applications(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(
        select(SectionApplication).where(SectionApplication.status == "pending").order_by(desc(SectionApplication.created_at))
    )
    apps = result.scalars().all()
    return resp(data=[SectionApplicationOut.model_validate(a).model_dump() for a in apps])


@router.post("/applications/{app_id}/approve")
async def approve_application(app_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(SectionApplication).where(SectionApplication.id == app_id))
    app = result.scalar_one_or_none()
    if not app or app.status != "pending":
        return resp(code=400, msg="Invalid application")

    # create section
    section = Section(
        name=app.name,
        description=app.description,
        parent_id=app.parent_section_id if app.app_type == "secondary" else None,
        creator_id=app.applicant_id,
    )
    db.add(section)
    await db.flush()

    # create default modules
    db.add(SectionModule(section_id=section.id, module_type=SectionModuleType.post))
    db.add(SectionModule(section_id=section.id, module_type=SectionModuleType.announcement))

    # update applicant role
    user_result = await db.execute(select(User).where(User.id == app.applicant_id))
    user = user_result.scalar_one()
    user.role = UserRole.moderator

    app.status = "approved"
    app.reviewer_id = admin.id
    app.reviewed_at = datetime.now(timezone.utc)

    await create_audit_log(db, admin.id, "approve_application", "section_application", app_id,
                           {"section_id": section.id, "name": app.name})
    await db.commit()
    return resp(msg="Application approved", data={"section_id": section.id})


@router.post("/applications/{app_id}/reject")
async def reject_application(app_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(SectionApplication).where(SectionApplication.id == app_id))
    app = result.scalar_one_or_none()
    if not app or app.status != "pending":
        return resp(code=400, msg="Invalid application")

    app.status = "rejected"
    app.reviewer_id = admin.id
    app.reviewed_at = datetime.now(timezone.utc)

    await create_audit_log(db, admin.id, "reject_application", "section_application", app_id)
    await db.commit()
    return resp(msg="Application rejected")


@router.get("/audit-logs")
async def list_audit_logs(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(
        select(AuditLog).order_by(desc(AuditLog.created_at)).limit(100)
    )
    logs = result.scalars().all()
    return resp(data=[{
        "id": log.id,
        "operator_id": log.operator_id,
        "action": log.action,
        "target_type": log.target_type,
        "target_id": log.target_id,
        "detail": log.detail,
        "created_at": log.created_at.isoformat(),
    } for log in logs])
