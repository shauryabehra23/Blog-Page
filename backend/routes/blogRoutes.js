const express = require("express");
const app = express.Router();
const {
  createBlog,
  getNextBlogs,
  getBlog,
  seedBlogs,
} = require("../controllers/blogControllers");
const { checkTokenMw, tokenAuthMw } = require("../middleWares/authMw");

// Create a new blog (requires authentication)
app.post("/create", checkTokenMw, createBlog);

// Get paginated blogs with optional sorting
app.get("/explore", getNextBlogs);

// Seed sample blogs (requires authentication - for admin use only)
app.get("/seed", tokenAuthMw, seedBlogs);

// Get a single blog by ID
app.get("/:id", getBlog);

module.exports = app;
