import { Link } from "react-router-dom";
import BlogCard from "../../components/BlogCard/BlogCard";
import "./HomePage.css";

export default function HomePage() {
  const featuredBlogs = [
    {
      id: 1,
      title: "Welcome to My Blog",
      author: "You",
      excerpt: "Share your thoughts and ideas with the world.",
      date: "2024-01-20",
      image: "https://via.placeholder.com/300x200",
    },
    {
      id: 2,
      title: "Building with Modern Tech",
      author: "You",
      excerpt: "Explore the latest technologies and frameworks.",
      date: "2024-01-19",
      image: "https://via.placeholder.com/300x200",
    },
  ];

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to My Blog</h1>
          <p>Share your stories, ideas, and insights with the world</p>
          <Link to="/add-blog" className="btn-primary">
            Start Writing
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <h2>Featured Blogs</h2>
        <div className="blogs-grid">
          {featuredBlogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2>Explore More</h2>
        <p>Discover blogs from our community</p>
        <Link to="/explore" className="btn-secondary">
          Browse All Blogs
        </Link>
      </section>
    </div>
  );
}
