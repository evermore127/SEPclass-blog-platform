from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserUpdate, UserOut
from app.services.user_service import register, authenticate, update_profile, create_token
from app.utils.file_upload import save_upload

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


@router.post("/register")
async def register_route(body: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await register(db, body.username, body.email, body.password)
    token = create_token(user.id)
    return resp(data={"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user)})


@router.post("/login")
async def login_route(body: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate(db, body.email, body.password)
    token = create_token(user.id)
    return resp(data={"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user)})


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return resp(data=UserOut.model_validate(current_user))


@router.put("/me")
async def update_me(body: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await update_profile(db, current_user, body.model_dump(exclude_none=True))
    return resp(data=UserOut.model_validate(user))


@router.post("/me/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    filepath = await save_upload(file, "avatars")
    current_user.avatar_url = f"{filepath}"
    await db.commit()
    await db.refresh(current_user)
    return resp(data={"avatar_url": current_user.avatar_url})


@router.get("/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return resp(code=404, msg="User not found")
    return resp(data=UserOut.model_validate(user))
