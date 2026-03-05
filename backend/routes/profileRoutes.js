const express = require("express");
const app = express.Router();
const { loginCon, registerCon } = require("../controllers/authControllers");
const { registerMw, loginMw, tokenAuthMw } = require("../middleWares/authMw");
const {
  getUserProfile,
  getMyProfile,
} = require("../controllers/ProfileControllers");

// app.post("/register", registerMw, registerCon);
// app.post("/login", loginMw, loginCon);

app.get("/user/:id", getUserProfile);
app.get("/my-profile", tokenAuthMw, getMyProfile);

module.exports = app;
