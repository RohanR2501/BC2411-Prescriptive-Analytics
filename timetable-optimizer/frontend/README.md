# Frontend - Timetable Optimizer

React + Vite frontend for the timetable optimizer.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## API URL

The app calls `POST <API_BASE_URL>/optimize` where `API_BASE_URL` is:

- `VITE_API_BASE_URL` from the environment (see `.env.example`), or
- `http://127.0.0.1:8000` when developing locally with the default backend.

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to your deployed backend (e.g. Render, Railway) when not using localhost.

## Local development

1. `npm install`
2. `npm run dev`
3. Run the FastAPI backend (see root `README.md`).

## Deploy (Vercel)

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com): **Add New Project** → import the repository.
3. Set **Root Directory** to `timetable-optimizer/frontend`.
4. Framework: Vite (auto-detected). Build: `npm run build`, Output: `dist`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = your public tunnel URL that forwards to your local backend (HTTPS, no trailing slash)
6. Deploy. Vercel will rebuild on every push to the connected branch.

GitHub Actions runs the same `lint` + `build` on pushes/PRs (see `.github/workflows/frontend-ci.yml`).
