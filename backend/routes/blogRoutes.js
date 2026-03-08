const express = require("express");
const app = express.Router();
const {
  createBlog,
  getNextBlogs,
  getBlog,
  seedBlogs,
  toggleLike,
  getLikeStatus,
} = require("../controllers/blogControllers");
const { checkTokenMw, tokenAuthMw } = require("../middleWares/authMw");
const { uploadBlogImages } = require("../config/multer");

// Create a new blog (requires authentication)
// Accepts: coverImage (front pic), content images sent as URLs in JSON
app.post(
  "/create",
  checkTokenMw,
  uploadBlogImages.single("coverImage"),
  createBlog,
);

// Get paginated blogs with optional sorting
app.get("/explore", getNextBlogs);

// Seed sample blogs (requires authentication - for admin use only)
app.get("/seed", tokenAuthMw, seedBlogs);

// Get a single blog by ID
app.get("/:id", getBlog);

// Toggle like on a blog (requires authentication)
app.post("/:id/like", checkTokenMw, toggleLike);

// Get like status for current user (requires authentication)
app.get("/:id/like/status", checkTokenMw, getLikeStatus);

module.exports = app;
