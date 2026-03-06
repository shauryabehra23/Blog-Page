const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true, default: "John Doe" },
    profilePic: {
      type: String,
      default:
        "https://res.cloudinary.com/demo/image/upload/default-avatar.png",
    },
    cloudinaryId: { type: String },

    // Summary metrics for fast UI rendering
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    totalLikesReceived: { type: Number, default: 0 },
  },
  { timestamps: true }, // Crucial for tracking when users joined
);

module.exports = mongoose.model("User", UserSchema);
