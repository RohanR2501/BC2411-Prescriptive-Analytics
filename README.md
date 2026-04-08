# BC2411 Prescriptive Analytics - Timetable Optimizer

Course timetable optimizer with:
- FastAPI backend (optimization with Gurobi)
- React + Vite frontend (interactive planner UI)

## Project Structure

- `timetable-optimizer/backend` - API + optimization model
- `timetable-optimizer/frontend` - web app UI

## Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js 20+ and npm
- A valid Gurobi license (academic is fine)

## Backend Setup (Conda Recommended)

From repository root:

1. Create and activate environment:
   - `conda create -n timetable_env python=3.11 -y`
   - `conda activate timetable_env`

2. Install backend dependencies:
   - `pip install -r timetable-optimizer/backend/requirements.txt`

3. Ensure Gurobi license is available:
   - Either use `gurobi.lic` in your expected license location, or
   - configure your license method per Gurobi docs.

4. Start backend:
   - `cd timetable-optimizer/backend`
   - `uvicorn main:app --reload --port 8000`

Health check:
- `http://127.0.0.1:8000/health` -> `{"status":"ok"}`

Warm-up ping (used by the frontend on load to reduce cold-start delay on hosted backends):
- `GET http://127.0.0.1:8000/ping` -> `{"status":"pong"}`

## Frontend Setup

In a new terminal:

1. `cd timetable-optimizer/frontend`
2. `npm install`
3. `npm run dev`

Frontend runs on `http://localhost:5173`.

## How To Use

1. Enter course IDs and interest scores.
2. Set min/max AUs and optimization weights.
3. Click **Optimize My Timetable**.
4. Review:
   - Summary metrics
   - Timetable visualization
   - Walking routes by day

## Reproducibility Notes

- Frontend dependencies are pinned via `package-lock.json`.
- Backend dependencies are pinned in `backend/requirements.txt`.
- Do not commit local environment folders (`.venv`, `env`, etc.).
- Do not commit secrets or license files (`gurobi.lic`, `.env`).

## Deploy frontend (Vercel) + run backend locally (free)

Vercel hosts the static frontend for free. For this setup, the FastAPI backend runs on **your own machine** in your conda environment.

1. Push the repo to GitHub.
2. Vercel: **New Project** → import repo → **Root Directory**: `timetable-optimizer/frontend`.
3. In Vercel → **Environment Variables**, set:
   - `VITE_API_BASE_URL` = a public URL that points to your local backend.

To expose your local backend publicly, use a tunnel (examples):
- **Cloudflare Tunnel** (recommended): map a public HTTPS URL to `http://localhost:8000`
- **ngrok**: map a public HTTPS URL to `http://localhost:8000`

Once you have the public URL, paste it into `VITE_API_BASE_URL` and redeploy in Vercel.

CI: GitHub Actions runs `npm ci`, `npm run lint`, and `npm run build` for the frontend folder (see `.github/workflows/frontend-ci.yml`).

## Common Issues

- **Could not reach backend on port 8000**
  - Ensure backend is running with `uvicorn` on `8000`.
- **Deployed site cannot reach API**
  - Set `VITE_API_BASE_URL` on Vercel to the tunnel URL that forwards to your local backend (HTTPS, no trailing slash).
- **Gurobi license not found / optimization fails**
  - Confirm your license is configured correctly in your environment.
- **No feasible schedule**
  - Relax AU bounds or adjust selected courses/weights.
