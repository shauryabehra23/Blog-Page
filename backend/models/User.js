const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    default: "John Doe",
  },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  totalLikesReceived: { type: Number, default: 0 },
  profilePic: {
    type: String,
    default: "https://res.cloudinary.com/demo/image/upload/default-avatar.png",
  },
  cloudinaryId: { type: String },
});

module.exports = mongoose.model("User", UserSchema);
