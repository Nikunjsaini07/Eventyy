import axios from "axios";

const fallbackApiUrl =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4000/api/v1"
    : "/api/v1";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || fallbackApiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("evn_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("evn_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
