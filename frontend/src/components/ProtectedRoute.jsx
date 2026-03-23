import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { isTokenValid } from "../utils/tokenUtils";

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 *
 * Usage:
 * <Route
 *   path="/protected"
 *   element={<ProtectedRoute component={<MyComponent />} />}
 * />
 */
export const ProtectedRoute = ({ component, fallback = "/login" }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Check if authenticated AND token is valid
  const isValid = isAuthenticated && isTokenValid();

  if (!isValid) {
    return <Navigate to={fallback} replace />;
  }

  return component;
};

/**
 * Optional: Redirect route for already authenticated users
 * Redirects to home if user is already logged in
 */
export const AuthRoute = ({ component, fallback = "/" }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (isAuthenticated && isTokenValid()) {
    return <Navigate to={fallback} replace />;
  }

  return component;
};
