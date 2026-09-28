import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null =
  typeof window !== "undefined"
    ? localStorage.getItem("intervexa_access_token")
    : null;

export function setAccessToken(token: string | null): void {
  accessToken = token;

  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("intervexa_access_token", token);
    } else {
      localStorage.removeItem("intervexa_access_token");
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("intervexa_access_token");
  }
  return null;
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;