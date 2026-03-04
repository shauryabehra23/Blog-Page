import { Link } from "react-router-dom";
import "./BlogCard.css";

export default function BlogCard({ blog }) {
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <article className="blog-card">
      <img src={blog.image} alt={blog.title} className="blog-image" />
      <div className="blog-content">
        <h3 className="blog-title">{blog.title}</h3>
        <p className="blog-excerpt">{blog.excerpt}</p>
        <div className="blog-meta">
          <span className="blog-author">{blog.author}</span>
          <span className="blog-date">{formatDate(blog.date)}</span>
        </div>
        <Link to={`/blog/${blog.id}`} className="btn-read-more">
          Read More →
        </Link>
      </div>
    </article>
  );
}
