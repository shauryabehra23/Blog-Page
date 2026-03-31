import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AuthContext } from "../../context/AuthContext";
import { Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react";
import heroLoginImg from "../../assets/images/heroLogin.jpg";

import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { login: contextLogin } = useContext(AuthContext);
  const { login: hookLogin, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    if (strength <= 1) return { text: "Weak", color: "bg-red-500" };
    if (strength <= 2) return { text: "Fair", color: "bg-yellow-500" };
    if (strength <= 3) return { text: "Good", color: "bg-blue-500" };
    return { text: "Strong", color: "bg-green-500" };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");
    setFieldErrors({});
    const newErrors = {};

    // Validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (isRegistering) {
      if (!name.trim()) {
        newErrors.name = "Name is required";
      } else if (name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      let result;
      if (isRegistering) {
        result = await register(name, email, password);
      } else {
        result = await hookLogin(email, password);
      }

      contextLogin(result.user, result.token);
      navigate("/");
    } catch (err) {
      // Error is handled by useAuth hook
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setEmail("");
    setPassword("");
    setName("");
    setValidationError("");
    setFieldErrors({});
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="login-container">
      {/* Background decoration */}
      <div className="background-pattern"></div>

      <div className="login-wrapper">
        {/* Left side - Branding */}
        <div className="login-branding">
          <img src={heroLoginImg} alt="Hero" className="branding-image" />
        </div>

        {/* Right side - Form */}
        <div className="login-form-wrapper">
          <div className="login-card">
            {/* Header */}
            <div className="form-header">
              <h1>{isRegistering ? "Create Account" : "Welcome Back"}</h1>
              <p>
                {isRegistering
                  ? "Start your blogging journey today"
                  : "Sign in to your account"}
              </p>
            </div>

            {/* Error Alert */}
            {(validationError || error) && (
              <div className="alert alert-error">
                <span>{validationError || error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {/* Name Field */}
              {isRegistering && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors({ ...fieldErrors, name: "" });
                        }
                      }}
                      placeholder="John Doe"
                      className={fieldErrors.name ? "input-error" : ""}
                    />
                  </div>
                  {fieldErrors.name && (
                    <span className="field-error">{fieldErrors.name}</span>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: "" });
                      }
                    }}
                    placeholder="you@example.com"
                    className={fieldErrors.email ? "input-error" : ""}
                  />
                </div>
                {fieldErrors.email && (
                  <span className="field-error">{fieldErrors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <div className="label-wrapper">
                  <label htmlFor="password">Password</label>
                  {password && !isRegistering && (
                    <span className="password-strength">
                      Strength: <strong>{strengthInfo.text}</strong>
                    </span>
                  )}
                </div>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: "" });
                      }
                    }}
                    placeholder="••••••••"
                    className={fieldErrors.password ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {isRegistering && password && (
                  <div className="strength-indicator">
                    <div className="strength-bars">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`bar ${i < passwordStrength ? "active" : ""}`}
                        ></div>
                      ))}
                    </div>
                    <span className={strengthInfo.color}>
                      {strengthInfo.text}
                    </span>
                  </div>
                )}

                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={18} className="spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegistering ? "Create Account" : "Sign In"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode */}
            <div className="auth-toggle">
              <p>
                {isRegistering
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </p>
              <button
                type="button"
                onClick={handleToggleMode}
                className="toggle-link"
              >
                {isRegistering ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="footer-info">
            <p>
              By {isRegistering ? "signing up" : "signing in"}, you agree to our{" "}
              <a href="#terms">Terms of Service</a> and{" "}
              <a href="#privacy">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
