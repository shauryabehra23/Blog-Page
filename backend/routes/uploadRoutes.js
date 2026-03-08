const express = require("express");
const router = express.Router();
const { checkTokenMw } = require("../middleWares/authMw");
const { upload } = require("../config/multer");
const cloudinary = require("../config/cloudinary");

// Upload single image to Cloudinary
// Returns the Cloudinary URL
// routes/uploadRoutes.js
router.post(
  "/image",
  checkTokenMw,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // ✅ Send both url and secure_url to frontend
      res.json({
        success: true,
        message: "Image uploaded successfully",
        url: req.file.path, // HTTP (keep for backwards compatibility)
        secure_url: req.file.secure_url, // HTTPS - Cloudinary secure URL
        filename: req.file.filename,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
      });
    }
  },
);

module.exports = router;
