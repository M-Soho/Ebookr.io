import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

// Attach JWT from localStorage on every request.
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ebookr_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return "Something went wrong";
}
