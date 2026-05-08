import os
import uuid
from pathlib import Path

from fastapi import UploadFile, HTTPException, status
from PIL import Image

from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


async def save_upload(file: UploadFile, subdir: str = "images") -> str:
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not allowed")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    upload_path = Path(settings.UPLOAD_DIR) / subdir
    os.makedirs(upload_path, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = upload_path / filename

    with open(filepath, "wb") as f:
        f.write(content)

    # try to validate image, remove if invalid
    try:
        img = Image.open(filepath)
        img.verify()
    except Exception:
        os.remove(filepath)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file")

    return f"{subdir}/{filename}"
