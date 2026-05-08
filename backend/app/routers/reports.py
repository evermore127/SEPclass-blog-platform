from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.report import Report
from app.models.user import User
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


@router.post("/")
async def create_report(body: ReportCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = Report(
        reporter_id=current_user.id,
        target_type=body.target_type,
        target_id=body.target_id,
        reason=body.reason,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return resp(data=ReportOut.model_validate(report).model_dump())
