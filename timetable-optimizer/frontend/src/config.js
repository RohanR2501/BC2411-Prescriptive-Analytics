/** Backend API origin (no trailing slash). Set VITE_API_BASE_URL in Vercel / .env.local for production. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
