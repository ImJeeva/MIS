"""
MIS AI microservice - chest X-ray first-look screening.

Endpoints:
  GET  /health          - liveness + which model mode is active
  POST /predict          - multipart form field `file` (image) -> screening result

This is a screening aid, NOT a diagnosis. The web app always shows the disclaimer
and a doctor reviews every image.
"""
from dataclasses import asdict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from predictor import Predictor

app = FastAPI(title="MIS AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = Predictor()

MAX_BYTES = 20 * 1024 * 1024
# Soft hint only - the real gate is "can PIL decode it as an image".
IMAGE_HINTS = {"image/jpeg", "image/png", "image/webp", "application/octet-stream", None, ""}


@app.get("/health")
def health():
    return {
        "up": True,
        "service": "mis-ai",
        "mode": predictor.mode,
        "model_name": predictor.model_name,
        "model_version": predictor.model_version,
        "calibrated": predictor.mode == "cnn",
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type and file.content_type not in IMAGE_HINTS and not file.content_type.startswith("image/"):
        raise HTTPException(415, f"Unsupported content type: {file.content_type}")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File too large")

    try:
        result = predictor.predict(data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(422, f"Could not read image: {exc}") from exc

    return asdict(result)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
