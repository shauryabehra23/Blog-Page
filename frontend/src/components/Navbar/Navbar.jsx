import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useContext(AuthContext);

  return (
    <nav className="bg-nav text-nav-foreground sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          BlogSpace
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/explore"
            className="font-body text-sm hover:text-primary transition-colors"
          >
            Explore
          </Link>
          {isAuthenticated && (
            <Link
              to="/add-blog"
              className="flex items-center gap-1.5 font-body text-sm hover:text-primary transition-colors"
            >
              <span>✏️</span>
              Write
            </Link>
          )}
          <button className="hover:text-primary transition-colors">
            <span>🔍</span>
          </button>
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hover:text-primary transition-colors"
              >
                <span>👤</span>
              </Link>
              <button
                onClick={logout}
                className="font-body text-sm hover:text-primary transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="font-body text-sm hover:text-primary transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
