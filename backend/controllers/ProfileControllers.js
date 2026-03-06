const User = require("../models/User");
const uploadToCDN = require("../helpers/cloudinaryHelp");

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }
    const user = await User.findOne({ _id: userId }).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "userNotFound",
      });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: "InternalServerError",
      error: error.message,
    });
  }
};

const getMyProfile = async (req, res) => {
  try {
    // Get user from the decoded token in req.user (set by auth middleware)
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }
    // Handle both user._id and user.id
    const userId = user._id || user.id;
    const userData = await User.findOne({ _id: userId }).select("-password");
    if (!userData) {
      return res.status(404).json({
        message: "userNotFound",
      });
    }
    return res.json(userData);
  } catch (error) {
    return res.status(500).json({
      message: "InternalServerError",
      error: error.message,
    });
  }
};

const changeProfPic = async (req, res) => {
  try {
    console.log("[changeProfPic] Request received");
    console.log("[changeProfPic] req.user:", req.user);
    console.log("[changeProfPic] req.file:", req.file);
    console.log("[changeProfPic] req.body:", req.body);

    // Get user from the decoded token in req.user (set by auth middleware)
    const user = req.user;
    if (!user) {
      console.log("[changeProfPic] No user in request");
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    // Extract user ID - handle both cases (user._id or user.id)
    const userId = user._id || user.id;
    console.log("[changeProfPic] User ID:", userId);

    if (!userId) {
      console.log("[changeProfPic] No user ID found");
      return res.status(401).json({
        message: "Invalid token - no user ID",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log(
        "[changeProfPic] No file in request - checking req.body for file info",
      );
      console.log("[changeProfPic] Multer may have put file info elsewhere");
      return res.status(400).json({
        message:
          "No image file uploaded. Please attach a file with field name 'profilePic'",
      });
    }

    // With Cloudinary storage, req.file contains the Cloudinary response
    // Note: Multer Cloudinary storage uses 'path' for the URL and 'filename' for public_id
    const profilePicUrl = req.file.path;
    const cloudinaryId = req.file.filename;

    console.log("[changeProfPic] Uploaded file URL:", profilePicUrl);
    console.log("[changeProfPic] Cloudinary ID:", cloudinaryId);

    // Update user profile in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: profilePicUrl,
        cloudinaryId: cloudinaryId,
      },
      { new: true },
    ).select("-password");

    console.log("[changeProfPic] Updated user:", updatedUser);

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePic: profilePicUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in changeProfPic:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { getUserProfile, getMyProfile, changeProfPic };
