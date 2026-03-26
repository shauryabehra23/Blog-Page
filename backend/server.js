require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connect = require("./DB/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const blogRoutes = require("./routes/blogRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const commentRoutes = require("./routes/commentRoutes");
const collaboratorRoutes = require("./routes/collaboratorRoutes");

const startServer = async () => {
  try {
    await connect();
    const app = express();

    // ✅ CORS configuration
    app.use(
      cors({
        origin: [
          "https://www.quillr.co.in",
          "https://quillr.co.in",
          "https://quillr.vercel.app",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
        ],
        credentials: true,
      }),
    );

    // ✅ SIMPLE! express.json() automatically ignores multipart/form-data
    // It only parses application/json requests
    app.use(express.json());

    // ✅ Also handle URL-encoded form data (optional)
    app.use(express.urlencoded({ extended: true }));

    // ✅ Routes - each handles its own parsing needs
    app.use("/auth", authRoutes); // Only JSON
    app.use("/profile", profileRoutes); // Mix of JSON and files
    app.use("/blogs", blogRoutes); // Mix of JSON and files
    app.use("/upload", uploadRoutes); // Only files (multer)
    app.use("/collaborator", collaboratorRoutes);
    app.use("/comments", commentRoutes); // Comment endpoints

    // ✅ Serve static files from frontend build
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    // ✅ SPA fallback: For any route not matching API routes, serve index.html
    // This allows React Router to handle client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });

    // ✅ 404 handler for undefined routes
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });

    // ✅ Global error handler
    app.use((err, req, res, next) => {
      console.error("Server Error:", err);

      // Handle multer errors
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Max size is 5MB.",
        });
      }

      if (err.message === "File too large") {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
  } catch (err) {
    console.log("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
