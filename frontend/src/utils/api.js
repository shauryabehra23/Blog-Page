import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the full error for debugging
    console.error("API Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API calls
export const authAPI = {
  login: (email, password) =>
    apiClient.post("/auth/login", { email, password }),
  register: (name, email, password) =>
    apiClient.post("/auth/register", { name, email, password }),
  logout: () => apiClient.post("/auth/logout"),
};

// Blog API calls
export const blogAPI = {
  getAll: (page = 1, limit = 10) =>
    apiClient.get("/blogs", { params: { page, limit } }),
  getById: (id) => apiClient.get(`/blogs/${id}`),
  create: (blogData) => apiClient.post("/blogs", blogData),
  update: (id, blogData) => apiClient.put(`/blogs/${id}`, blogData),
  delete: (id) => apiClient.delete(`/blogs/${id}`),
  search: (query) => apiClient.get("/blogs/search", { params: { q: query } }),
};

// User API calls
export const userAPI = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (userData) => apiClient.put("/users/profile", userData),
  getById: (id) => apiClient.get(`/users/${id}`),
};

export default apiClient;
