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
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }
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
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const userId = user._id || user.id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token - no user ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No image file uploaded",
      });
    }

    const profilePicUrl = req.file.path;
    const cloudinaryId = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: profilePicUrl,
        cloudinaryId: cloudinaryId,
      },
      { new: true },
    ).select("-password");

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
