from fastapi import FastAPI
from config import settings

app = FastAPI(title="AI Service")


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "healthy"}


# start with:
# uv run uvicorn main:app --reload --port 8000
