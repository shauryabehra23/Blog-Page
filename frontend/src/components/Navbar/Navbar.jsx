import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Pen, User } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <nav className="bg-nav text-nav-foreground sticky top-0 z-50 border-b border-border/40 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 max-w-7xl">
        {/* Logo - Stays consistent */}
        <Link
          to="/"
          className="lobster-two-bold-italic text-3xl md:text-5xl font-bold tracking-tight"
        >
          Quillr
        </Link>

        {/* Navigation Links - Responsive Gap */}
        <div className="flex items-center gap-3 md:gap-6">
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
              <Pen size={17} />
              {/* Optional: Hide text "Write" on very small screens to save space */}
              <span className="hidden sm:inline">Write</span>
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hover:text-primary transition-colors flex items-center"
              >
                <User size={20} />
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
