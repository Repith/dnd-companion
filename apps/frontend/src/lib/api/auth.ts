import axios from "axios";
import { LoginRequest, RegisterRequest, AuthResponse, User } from "#types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For HTTP-only cookies
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid, clear it
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    const authData = response.data;

    // Store the access token
    if (authData.access_token) {
      localStorage.setItem("access_token", authData.access_token);
    }

    return authData;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post<User>("/users/register", userData);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>("/users/profile");
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Clear the stored token
    localStorage.removeItem("access_token");

    // If backend has logout endpoint, call it here
    // For now, just clear client state
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Ignore logout endpoint errors
    }
  },
};

export default api;
