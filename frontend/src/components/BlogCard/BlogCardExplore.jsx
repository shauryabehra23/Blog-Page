import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import blog1Img from "../../assets/images/blog-1.jpg";

export default function BlogCardExplore({ blog, index = 0 }) {
  const blogId = blog.id || blog._id;

  // Handle author - could be object with name or string
  const authorName = blog.author?.name || blog.author || "Unknown Author";

  // Handle date - could be string or Date object
  const formattedDate = blog.date
    ? new Date(blog.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : blog.createdAt
      ? new Date(blog.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Unknown Date";

  // Handle excerpt - could be direct field or need to extract from content
  const excerpt = blog.excerpt || "";

  // Handle image - use frontPic first, then fall back to blog.image, then placeholder
  const image = blog.frontPic || blog.image || blog1Img;

  return (
    <Link
      to={`/blog/${blogId}`}
      className="group block glass-card rounded-xl overflow-hidden hover:shadow-gold transition-all duration-500"
      style={{ animation: `slide-up 0.6s ease-out ${index * 0.15}s both` }}
    >
      <div className="relative overflow-hidden aspect-[16/10]">
        <img
          src={image}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <div className="p-6 space-y-3">
        <h3 className="text-xl font-bold font-[var(--font-display)] text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
          {blog.title}
        </h3>

        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {excerpt}
        </p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User size={13} />
              {authorName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {formattedDate}
            </span>
          </div>

          <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0">
            Read <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
