import { useState, useCallback } from "react";
import { authAPI } from "../utils/api";
import { getErrorMessage } from "../utils/errorHandler";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError("");
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;
      localStorage.setItem("token", token);
      setUser(userData);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err, "Login failed");
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError("");
    try {
      const response = await authAPI.register(name, email, password);
      const { token, user: userData } = response.data;
      localStorage.setItem("token", token);
      setUser(userData);
      return response.data;
    } catch (err) {
      const message = getErrorMessage(err, "Registration failed");
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setError("");
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};
