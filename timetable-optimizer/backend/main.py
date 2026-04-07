# backend/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from optimizer import optimize_schedule

app = FastAPI()

# This allows your React frontend (running on port 5173) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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

@app.get("/health")
def health():
    return {"status": "ok"}

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
            min_au=req.min_au
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