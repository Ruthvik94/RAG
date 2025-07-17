// API configuration for endpoints

// Dynamically derive host from environment variable (uncomment for production)
const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:3000";
// const API_HOST = "http://localhost:3000"; // fallback for local dev

export const API_ENDPOINTS = {
  QUERY: `${API_HOST}/api/query`,
  INGEST: `${API_HOST}/api/ingest`,

  UPLOAD: `${API_HOST}/documents/upload`,
};
