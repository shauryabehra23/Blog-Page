import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">📝</span>
          MyBlog
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/explore" className="nav-link">
            Explore
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/add-blog" className="nav-link">
                Write
              </Link>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">Hi, {user?.name || "User"}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-login">
              Login
            </Link>
          )}
          <button className="hamburger" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
