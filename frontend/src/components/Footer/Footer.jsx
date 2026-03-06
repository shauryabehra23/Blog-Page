import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-nav text-nav-foreground border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Link
              to="/"
              className="font-display text-xl font-bold tracking-tight"
            >
              BlogSpace
            </Link>
            <p className="text-sm text-muted-foreground">
              Share your thoughts with the world
            </p>
          </div>

          <div className="flex gap-6">
            <Link
              to="/explore"
              className="font-body text-sm hover:text-primary transition-colors"
            >
              Explore
            </Link>
            <Link
              to="/add-blog"
              className="font-body text-sm hover:text-primary transition-colors"
            >
              Write
            </Link>
            <Link
              to="/login"
              className="font-body text-sm hover:text-primary transition-colors"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BlogSpace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
