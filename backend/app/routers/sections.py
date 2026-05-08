from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.section import Section, SectionModule, SectionApplication
from app.models.user import User
from app.schemas.section import SectionOut, SectionApply, SectionApplicationOut

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


async def _build_section_tree(sections: list[Section], parent_id: int | None = None) -> list[dict]:
    tree = []
    for s in sections:
        if s.parent_id == parent_id:
            children = await _build_section_tree(sections, s.id)
            tree.append({
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "parent_id": s.parent_id,
                "creator_id": s.creator_id,
                "status": s.status.value,
                "created_at": s.created_at.isoformat(),
                "children": children,
                "modules": [{"id": m.id, "section_id": m.section_id, "module_type": m.module_type.value} for m in s.modules],
            })
    return tree


@router.get("/")
async def list_sections(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Section).options(selectinload(Section.modules)).where(Section.status == "active")
    )
    sections = result.scalars().all()
    tree = await _build_section_tree(list(sections))
    return resp(data=tree)


@router.get("/{section_id}")
async def get_section(section_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Section).options(selectinload(Section.modules)).where(Section.id == section_id)
    )
    section = result.scalar_one_or_none()
    if not section:
        return resp(code=404, msg="Section not found")
    return resp(data=SectionOut.model_validate(section))


@router.post("/apply")
async def apply_section(body: SectionApply, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = await db.execute(select(SectionApplication).where(
        SectionApplication.applicant_id == current_user.id,
        SectionApplication.status == "pending",
    ))
    if existing.scalar_one_or_none():
        return resp(code=400, msg="You already have a pending application")

    app = SectionApplication(
        applicant_id=current_user.id,
        app_type=body.app_type,
        parent_section_id=body.parent_section_id,
        name=body.name,
        description=body.description,
        reason=body.reason,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return resp(data=SectionApplicationOut.model_validate(app))
