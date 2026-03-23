import { createContext, useState, useCallback, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { isTokenValid, clearAuthData } from "../utils/tokenUtils";

// Load initial state from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // Validate token before setting authenticated state
    if (token && userData && isTokenValid()) {
      const parsedUser = JSON.parse(userData);
      return {
        user: parsedUser,
        isAuthenticated: true,
        loading: false,
      };
    }

    // Clear invalid token
    if (token && !isTokenValid()) {
      console.warn("Token expired or invalid. Clearing auth data.");
      clearAuthData();
    }
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    clearAuthData();
  }
  return {
    user: null,
    isAuthenticated: false,
    loading: false,
  };
};

const initialState = getInitialAuthState();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(
    initialState.isAuthenticated,
  );
  const [loading, setLoading] = useState(initialState.loading);

  // Optional: Sync effect for token changes from other tabs (storage event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "user") {
        window.location.reload(); // Simple sync: reload (or implement proper sync)
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback((userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    setLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
