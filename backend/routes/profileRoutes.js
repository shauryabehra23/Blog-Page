const express = require("express");
const app = express.Router();
const { loginCon, registerCon } = require("../controllers/authControllers");
const { registerMw, loginMw, tokenAuthMw } = require("../middleWares/authMw");
const {
  getUserProfile,
  getMyProfile,
  changeProfPic,
} = require("../controllers/ProfileControllers");
const upload = require("../config/multer");

// app.post("/register", registerMw, registerCon);
// app.post("/login", loginMw, loginCon);

app.get("/user/:id", getUserProfile);
app.get("/my-profile", tokenAuthMw, getMyProfile);

// Route for changing profile picture
app.post(
  "/change-profile-pic",
  tokenAuthMw,
  upload.single("profilePic"),
  changeProfPic,
);

module.exports = app;
