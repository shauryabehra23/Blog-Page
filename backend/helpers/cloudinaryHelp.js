const cloudinary = require("../config/cloudinary");
const UserModel = require("../models/User");

const uploadToCDN = async (filePath, userId) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "blog-app/users",
      public_id: `profile-${userId}-${Date.now()}`,
      overwrite: false,
      transformation: [{ width: 500, height: 500, crop: "fill" }],
    });

    const user = await UserModel.findByIdAndUpdate(
      userId,
      {
        profilePic: result.secure_url,
        cloudinaryId: result.public_id,
      },
      { new: true },
    );

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      user: user,
      imageUrl: result.secure_url,
    };
  } catch (error) {
    console.error("Upload to CDN failed:", error);

    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
};

module.exports = uploadToCDN;
