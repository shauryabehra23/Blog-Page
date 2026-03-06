const cloudinary = require("../config/cloudinary");
const UserModel = require("../models/User");

const uploadToCDN = async (filePath, userId) => {
  try {
    // 1. Upload to Cloudinary (AWAIT here)
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `users/${userId}/`,
      public_id: "profilePic", // Note: public_id, not publicId
      overwrite: true,
      transformation: [{ width: 200, height: 200, crop: "fill" }],
    });

    // 2. Update user in database (AWAIT here)
    const user = await UserModel.findOneAndUpdate(
      { _id: userId },
      {
        profilePic: result.secure_url, // Use secure_url for HTTPS
        cloudinaryId: result.public_id,
      },
      { new: true }, // Return the updated document
    );

    // 3. Check if user was found
    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // 4. Return success with user data
    return {
      success: true,
      user: user,
      imageUrl: result.secure_url,
    };
  } catch (error) {
    console.error("Upload to CDN failed:", error);

    // Return detailed error for controller to handle
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
};

module.exports = uploadToCDN;
