const express = require("express");
const app = express.Router();
const {
  createBlog,
  getNextBlogs,
  getBlog,
  getBlogForEdit,
  updateBlog,
  getUserBlogs,
  getUserCollaboratingBlogs,
  updateSectionContent,
  approveSectionContent,
  rejectSectionContent,
  saveMasterContent,
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

// ✅ DEBUG: Check all blogs in database
app.get("/debug/all-blogs", async (req, res) => {
  try {
    const Blog = require("../models/Blog");
    const blogs = await Blog.find().select("_id author title createdAt");
    console.log("[DEBUG] Total blogs in DB:", blogs.length);
    res.json({ count: blogs.length, blogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET: User's authored blogs (must come before /:id)
app.get("/user/:userId", getUserBlogs);

// ✅ GET: Blogs user is collaborating on (must come before /:id)
app.get("/user/:userId/collaborating", getUserCollaboratingBlogs);

// ✅ ADD: Get blog for editing with role-based access (must come before /:id)
app.get("/:id/edit-access", checkTokenMw, getBlogForEdit);

// ✅ NEW: Update blog (author can update draft or publish)
app.put(
  "/:id",
  checkTokenMw,
  uploadBlogImages.single("coverImage"),
  updateBlog,
);

// ✅ NEW: Update section content and status (must come before /:id)
app.put("/:blogId/sections/:sectionId", checkTokenMw, updateSectionContent);

// ✅ NEW: Approve section (author only)
app.post(
  "/:blogId/sections/:sectionId/approve",
  checkTokenMw,
  approveSectionContent,
);

// ✅ NEW: Reject section (author only)
app.post(
  "/:blogId/sections/:sectionId/reject",
  checkTokenMw,
  rejectSectionContent,
);

// ✅ NEW: Save master edits (author only)
app.put(
  "/:blogId/sections/:sectionId/save-master",
  checkTokenMw,
  saveMasterContent,
);

// Get a single blog by ID
app.get("/:id", getBlog);

// Toggle like on a blog (requires authentication)
app.post("/:id/like", checkTokenMw, toggleLike);

// Get like status for current user (requires authentication)
app.get("/:id/like/status", checkTokenMw, getLikeStatus);

module.exports = app;
