import { useEffect, useState } from "react";
import { Select, Loader, Button } from "@mantine/core";
import BlogCardExplore from "../../components/BlogCard/BlogCardExplore";
import { blogAPI } from "../../utils/api";
import "./ExplorePage.css";

export default function ExplorePage() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch blogs function
  const fetchBlogs = async (page = 1, sort = "newest", isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setBlogs([]);
      }
      setError("");

      const response = await blogAPI.getExplore(page, sort);

      console.log("Explore API Response:", response.data);

      // Handle both success and non-success responses
      const blogsData = response.data.blogs || response.data;
      const paginationData = response.data.pagination || {};

      if (Array.isArray(blogsData)) {
        if (isLoadMore) {
          setBlogs((prevBlogs) => [...prevBlogs, ...blogsData]);
        } else {
          setBlogs(blogsData);
        }

        setHasNextPage(paginationData.hasNextPage || false);
        setCurrentPage(page);
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Unexpected response format from server");
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load blogs. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlogs(1, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
    fetchBlogs(1, value);
  };

  // Handle load more
  const handleLoadMore = () => {
    fetchBlogs(currentPage + 1, sortBy, true);
  };

  // Filter blogs based on search term - with safe null checks
  const filteredBlogs = blogs.filter((blog) => {
    const titleMatch = blog.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const authorMatch = (blog.author?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return titleMatch || authorMatch;
  });

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1>Explore Blogs</h1>

        <div className="explore-controls">
          <input
            type="text"
            placeholder="Search blogs or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <Select
            label="Sort By"
            placeholder="Select sorting option"
            value={sortBy}
            onChange={handleSortChange}
            data={[
              { value: "newest", label: "Newest First" },
              { value: "mostLiked", label: "Most Liked" },
            ]}
            searchable
            clearable
            className="sort-select"
          />
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Loader size="lg" />
          <p>Loading blogs...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="empty-state">
          <p>
            {blogs.length === 0
              ? "No blogs available yet. Be the first to create one!"
              : "No matching blogs found."}
          </p>
        </div>
      ) : (
        <>
          <div className="blogs-grid">
            {filteredBlogs.map((blog) => (
              <BlogCardExplore key={blog._id} blog={blog} index={0} />
            ))}
          </div>

          {hasNextPage && (
            <div className="load-more-container">
              <Button
                onClick={handleLoadMore}
                loading={isLoadingMore}
                disabled={isLoadingMore}
                size="md"
              >
                {isLoadingMore ? "Loading..." : "Load More Blogs"}
              </Button>
            </div>
          )}

          {!hasNextPage && blogs.length > 0 && (
            <div className="no-more-blogs">
              <p>No more blogs to load</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
