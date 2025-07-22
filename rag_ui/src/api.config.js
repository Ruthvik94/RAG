// API configuration for endpoints

// Dynamically derive host from environment variable (uncomment for production)
const API_HOST = import.meta.env.VITE_API_URL || "http://localhost:3000";
// const API_HOST = "http://localhost:3000"; // fallback for local dev

export const API_ENDPOINTS = {
  QUERY: `${API_HOST}/api/query`,
  INGEST: `${API_HOST}/api/ingest`,
  LOAD_SAMPLE_DATASET: `${API_HOST}/api/load-sample-dataset`,
  CLEAR_DOCUMENTS: `${API_HOST}/api/clear-documents`,
};
