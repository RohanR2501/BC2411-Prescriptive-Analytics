# backend/main.py

from pathlib import Path
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from optimizer import optimize_schedule

# Gurobi WLS: WLSACCESSID, WLSSECRET, LICENSEID (see .env.example).
load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI()

# This allows your React frontend (running on port 5173) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# This defines exactly what shape of data the frontend must send
class OptimizeRequest(BaseModel):
    interest_dict: dict[str, int]
    max_au: int
    min_au: int
    weights: dict[str, float]
    num_solutions: int = Field(default=1, ge=1, le=20)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ping")
def ping():
    """Lightweight endpoint for frontend warm-up (e.g. cold-start on free hosting)."""
    return {"status": "pong"}


@app.post("/optimize")
def optimize(req: OptimizeRequest):
    # The CSV lives in the same backend/ folder
    csv_path = os.path.join(os.path.dirname(__file__), "final_with_location.csv")

    try:
        result = optimize_schedule(
            csv_filepath=csv_path,
            interest_dict=req.interest_dict,
            weights=req.weights,
            max_au=req.max_au,
            min_au=req.min_au,
            num_solutions=req.num_solutions,
        )
        return result

    except RuntimeError as e:
        # Gurobi license missing
        raise HTTPException(status_code=503, detail=str(e))

    except ValueError as e:
        # No feasible solution or courses not found
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
