const User = require("../models/User");

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
    const userData = await User.findOne({ _id: user._id }).select("-password");
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
  } catch (err) {}
};

module.exports = { getUserProfile, getMyProfile };
