from fastapi import APIRouter, Depends, UploadFile, File

from app.dependencies import get_current_user
from app.models.user import User
from app.utils.file_upload import save_upload

router = APIRouter()


def resp(code: int = 0, data=None, msg: str = "ok"):
    return {"code": code, "data": data, "msg": msg}


@router.post("/image")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    filepath = await save_upload(file, "images")
    return resp(data={"url": f"/static/{filepath}"})
