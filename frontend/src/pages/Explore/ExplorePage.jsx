import { useState } from "react";
import BlogCard from "../../components/BlogCard/BlogCard";
import "./ExplorePage.css";

export default function ExplorePage() {
  const [blogs] = useState([
    {
      id: 1,
      title: "Getting Started with React",
      author: "Jane Doe",
      excerpt: "Learn the basics of React and build your first component.",
      date: "2024-01-15",
      image: "https://via.placeholder.com/300x200",
    },
    {
      id: 2,
      title: "Node.js Best Practices",
      author: "John Smith",
      excerpt: "Essential tips and tricks for writing better Node.js code.",
      date: "2024-01-14",
      image: "https://via.placeholder.com/300x200",
    },
    {
      id: 3,
      title: "CSS Grid Layout Guide",
      author: "Sarah Wilson",
      excerpt: "Master CSS Grid and create responsive layouts easily.",
      date: "2024-01-13",
      image: "https://via.placeholder.com/300x200",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore Blogs</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="blogs-grid">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </div>
  );
}
