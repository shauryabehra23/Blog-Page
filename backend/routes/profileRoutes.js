const express = require("express");
const app = express.Router();
const { loginCon, registerCon } = require("../controllers/authControllers");
const { registerMw, loginMw, tokenAuthMw } = require("../middleWares/authMw");
const {
  getUserProfile,
  getMyProfile,
  changeProfPic,
} = require("../controllers/ProfileControllers");
const { uploadProfile } = require("../config/multer");

app.get("/user/:id", getUserProfile);
app.get("/my-profile", tokenAuthMw, getMyProfile);

app.post(
  "/change-profile-pic",
  tokenAuthMw,
  uploadProfile.single("profilePic"),
  changeProfPic,
);

module.exports = app;
