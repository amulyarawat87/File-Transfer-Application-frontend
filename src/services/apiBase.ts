const rawApiBase = import.meta.env.VITE_API_BASE ?? "http://localhost:8080/api";

export const API_BASE = rawApiBase.replace(/\/$/, "");