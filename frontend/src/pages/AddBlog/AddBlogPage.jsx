import { useState } from "react";
import "./AddBlogPage.css";

export default function AddBlogPage() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "technology",
    tags: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setError("Please fill in all required fields");
      return;
    }
    // Add blog submission logic here
    console.log("Blog submitted:", formData);
    setFormData({ title: "", content: "", category: "technology", tags: "" });
  };

  return (
    <div className="addblog-container">
      <div className="addblog-card">
        <h1>Create New Blog</h1>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Blog Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter blog title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="technology">Technology</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="travel">Travel</option>
              <option value="food">Food</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your blog content here..."
              rows="10"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. react, javascript, web"
            />
          </div>

          <button type="submit" className="btn-primary">
            Publish Blog
          </button>
        </form>
      </div>
    </div>
  );
}
