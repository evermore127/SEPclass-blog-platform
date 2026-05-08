from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def create_audit_log(
    db: AsyncSession,
    operator_id: int,
    action: str,
    target_type: str,
    target_id: int,
    detail: dict | None = None,
):
    log = AuditLog(
        operator_id=operator_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    )
    db.add(log)
    await db.commit()
