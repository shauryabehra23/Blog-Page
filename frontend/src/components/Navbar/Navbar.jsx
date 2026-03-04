import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          <Link to="/add-blog" className="nav-link">
            Write
          </Link>
          <Link to="/profile" className="nav-link">
            Profile
          </Link>
        </div>

        <div className="navbar-actions">
          <Link to="/login" className="btn-login">
            Login
          </Link>
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
