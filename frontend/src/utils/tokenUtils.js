/**
 * Token Validation Utilities
 * Provides functions to check token validity and decode JWT claims
 */

/**
 * Check if a token exists in localStorage
 */
export const hasToken = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

/**
 * Get the current token
 */
export const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Check if token is expired by decoding JWT payload
 * JWT format: header.payload.signature
 */
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Decode payload (add padding if needed)
    const payload = parts[1];
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(paddedPayload));

    // Check expiration
    if (decoded.exp) {
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      return currentTime >= expirationTime;
    }

    return false;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Consider it expired if we can't decode it
  }
};

/**
 * Check if token is valid (exists and not expired)
 */
export const isTokenValid = () => {
  return hasToken() && !isTokenExpired();
};

/**
 * Get user data from localStorage
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Decode JWT token and return payload
 */
export const decodeToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(paddedPayload));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Get time remaining until token expires (in milliseconds)
 */
export const getTokenTimeRemaining = () => {
  const decoded = decodeToken();
  if (!decoded || !decoded.exp) return 0;

  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  return Math.max(0, expirationTime - currentTime);
};
