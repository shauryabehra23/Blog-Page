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
    // Don't set Content-Type for FormData - let the browser/axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
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
  create: (blogData) => apiClient.post("/blogs/create", blogData),
  getExplore: (page = 1, sortBy = "newest") =>
    apiClient.get("/blogs/explore", { params: { page, sortBy } }),
  getById: (id) => apiClient.get(`/blogs/${id}`),
  likeBlog: (id) => apiClient.post(`/blogs/${id}/like`),
  getLikeStatus: (id) => apiClient.get(`/blogs/${id}/like/status`),
};

// User API calls
export const userAPI = {
  getProfile: () => apiClient.get("/profile/my-profile"),
  updateProfile: (userData) => apiClient.put("/profile/my-profile", userData),
  getById: (id) => apiClient.get(`/profile/user/${id}`),
  // Note: Do NOT set Content-Type header manually for FormData
  // Axios automatically sets it with the correct boundary
  updateProfilePic: (formData) =>
    apiClient.post("/profile/change-profile-pic", formData),
};

export default apiClient;
