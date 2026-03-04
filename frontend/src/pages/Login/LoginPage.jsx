import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthContext } from "../../context/AuthContext";

import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState("");

  const { login: contextLogin } = useContext(AuthContext);
  const { login: hookLogin, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(""); // Clear previous validation errors

    // Validation
    if (!email.trim()) {
      setValidationError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    if (!password.trim()) {
      setValidationError("Password is required");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long");
      return;
    }

    if (isRegistering) {
      if (!name.trim()) {
        setValidationError("Name is required");
        return;
      }
      if (name.trim().length < 2) {
        setValidationError("Name must be at least 2 characters long");
        return;
      }
    }

    try {
      let result;
      if (isRegistering) {
        result = await register(name, email, password);
      } else {
        result = await hookLogin(email, password);
      }

      // Update context with login data
      contextLogin(result.user, result.token);
      navigate("/");
    } catch (err) {
      // Error is handled by useAuth hook
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isRegistering ? "Register" : "Login"}</h1>
        {(validationError || error) && (
          <p className="error-message">{validationError || error}</p>
        )}
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Processing..." : isRegistering ? "Register" : "Login"}
          </button>
        </form>
        <p className="signup-link">
          {isRegistering
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Login" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
