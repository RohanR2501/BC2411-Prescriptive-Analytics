# BC2411 Prescriptive Analytics – Timetable Optimizer

A course timetable optimizer that generates optimal schedules based on user preferences, academic constraints, and campus logistics.

---

##  Features

-  Multi-objective optimization (interest, AUs, campus days, walking distance)
-  Powered by Gurobi optimization solver
-  Interactive web UI (React + Vite)
-  Walking route estimation between classes
-  FastAPI backend with structured API

---

##  Project Structure

```

timetable-optimizer/
├── backend/     # FastAPI API + optimization model
├── frontend/    # React + Vite web application

````

---

##  Tech Stack

- **Frontend:** React, Vite  
- **Backend:** FastAPI  
- **Solver:** Gurobi (WLS)  
- **Deployment:**
  - Frontend → Vercel
  - Backend → Render (Docker)

---

##  Local Setup

### Prerequisites

- Python 3.10+ (3.11 recommended)
- Node.js 20+
- npm
- Gurobi license (Academic WLS recommended)

---

### Backend Setup (Conda Recommended)

From repository root:

```bash
conda create -n timetable_env python=3.11 -y
conda activate timetable_env
pip install -r timetable-optimizer/backend/requirements.txt
````

## Gurobi License
You can either:
   - Ensure Gurobi WLS credentials are available (this backend uses Gurobi Web License Service)
   - Copy `timetable-optimizer/backend/.env.example` to `timetable-optimizer/backend/.env`.
   - Set `WLSACCESSID`, `WLSSECRET`, and `LICENSEID` (integer) from your Gurobi account.
   - Alternatively, export the same variables in your shell; real env vars override `.env`.

* use a `gurobi.lic` file locally, OR
* configure WLS environment variables (recommended)

---

### Start Backend

```bash
cd timetable-optimizer/backend
uvicorn main:app --reload --port 8000
```

Test endpoints:

* Health: `http://127.0.0.1:8000/health`
* Ping: `http://127.0.0.1:8000/ping`

---

### Frontend Setup

```bash
cd timetable-optimizer/frontend
npm install
npm run dev
```

Runs at:

```
http://localhost:5173
```

---

##  Deployment

### Frontend (Vercel)

1. Import GitHub repo into Vercel
2. Set **Root Directory** to:

```
frontend
```

3. Set environment variable:

```env
VITE_API_BASE_URL=https://<your-backend-url>
```

4. Deploy

---

### Backend (Render / Docker)

Backend is deployed separately (e.g. Render using Docker).

#### Required Environment Variables

```env
WLSACCESSID=your_access_id
WLSSECRET=your_secret
LICENSEID=your_license_id
```

 These are required for Gurobi WLS and must be set in the backend hosting platform.

After setting, redeploy the backend service.

---

## Gurobi License Setup

This project uses **Gurobi Web License Service (WLS)**.

To obtain credentials:

1. Log in to Gurobi User Portal
2. Create an **Academic WLS license**
3. Retrieve:

   * `WLSACCESSID`
   * `WLSSECRET`
   * `LICENSEID`
4. Set them as environment variables (backend only)

---

##  API Overview

### `GET /health`

Returns backend status:

```json
{ "status": "ok" }
```

---

### `GET /ping`

Used for cold-start warmup:

```json
{ "status": "pong" }
```

---

### `POST /optimize`

#### Request Body

```json
{
  "interest_dict": { "CZ2001": 8 },
  "max_au": 21,
  "min_au": 15,
  "weights": {
    "alpha": 1.0,
    "beta": 0.5,
    "gamma": 0.5,
    "delta": 0.2
  },
  "num_solutions": 1
}
```

#### Response

Returns optimized timetable, metrics, and walking routes.

---

##  How To Use

1. Enter course IDs and interest scores
2. Set AU limits and optimization weights
3. Click **Optimize My Timetable**
4. Review:

   * Selected courses
   * Timetable layout
   * Campus days
   * Walking routes

---

##  Environment Variables Summary

### Frontend (Vercel)

```env
VITE_API_BASE_URL=...
```

### Backend

```env
WLSACCESSID=...
WLSSECRET=...
LICENSEID=...
```

---

##  Common Issues

###  Frontend cannot reach backend

* Ensure `VITE_API_BASE_URL` is set correctly (not localhost)
* Ensure backend is deployed and running

---

###  Missing Gurobi WLS variables

Error:

```
Missing required Gurobi WLS environment variables
```

Fix:

* Set all 3 variables on backend host
* Restart backend

---

###  400 Bad Request on `/optimize`

* Ensure request body matches required schema
* Check types (dicts, ints, floats)

---

###  No feasible schedule

* Relax AU constraints
* Adjust selected courses or weights

---

##  Reproducibility Notes

* Frontend dependencies locked via `package-lock.json`
* Backend dependencies in `requirements.txt`
* Do not commit:

  * `.env`
  * `gurobi.lic`
  * virtual environments (`.venv`, `env`, etc.)

---

##  Notes

* Backend requires Gurobi — cannot run without a valid license
* Optimization runs server-side only
* Frontend is purely a UI layer

---

##  License

For academic use only. Gurobi license terms apply.

<<<<<<< Updated upstream
=======
- **Could not reach backend on port 8000**
  - Ensure backend is running with `uvicorn` on `8000`.
- **Deployed site cannot reach API**
  - Set `VITE_API_BASE_URL` on Vercel to the tunnel URL that forwards to your local backend (HTTPS, no trailing slash).
- **Gurobi license not found / optimization fails**
  - Confirm `WLSACCESSID`, `WLSSECRET`, and `LICENSEID` are set in `backend/.env` (see `.env.example`) or in your process environment.
- **No feasible schedule**
  - Relax AU bounds or adjust selected courses/weights.
>>>>>>> Stashed changes
