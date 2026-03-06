import { Link } from "react-router-dom";
import { Badge } from "@mantine/core";
import "./BlogCard.css";

export default function BlogCard({ blog }) {
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Handle author data (could be string or object)
  const authorName =
    typeof blog.author === "string"
      ? blog.author
      : blog.author?.name || "Unknown";

  const authorId = typeof blog.author === "string" ? null : blog.author?._id;

  // Extract excerpt from HTML content (first 100 characters)
  const stripHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent || div.innerText || "";
  };

  const excerpt = stripHtml(blog.content || "").substring(0, 120) + "...";

  return (
    <article className="blog-card">
      <div className="blog-card-header">
        <h3 className="blog-title">{blog.title}</h3>
      </div>

      <div className="blog-card-content">
        <p className="blog-excerpt">{excerpt}</p>

        <div className="blog-stats">
          <Badge variant="light" size="sm">
            {blog.likesCount || 0} Likes
          </Badge>
          <Badge variant="light" size="sm">
            {blog.views || 0} Views
          </Badge>
        </div>
      </div>

      <div className="blog-card-footer">
        <div className="blog-author-info">
          {authorId ? (
            <Link to={`/profile/${authorId}`} className="blog-author-button">
              {authorName}
            </Link>
          ) : (
            <span className="blog-author-name">{authorName}</span>
          )}
          <p className="blog-date">{formatDate(blog.createdAt)}</p>
        </div>

        <Link to={`/blog/${blog._id}`} className="btn-read-more">
          Read More →
        </Link>
      </div>
    </article>
  );
}
