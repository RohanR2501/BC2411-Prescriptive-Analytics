# Frontend - Timetable Optimizer

React + Vite frontend for the timetable optimizer.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## Local Development

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. By default, the app calls the deployed backend at `https://bc2411-prescriptive-analytics.onrender.com`.
4. Optional: Override backend URL with a Vite env variable:
   - Create `.env` and set `VITE_API_BASE_URL=http://localhost:8000` (or another backend URL)

The app sends optimization requests to:

- `POST <VITE_API_BASE_URL>/optimize` (or the default deployed backend URL above)
