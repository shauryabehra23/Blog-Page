const express = require("express");
const app = express.Router();
const { loginCon, registerCon } = require("../controllers/authControllers");
const { registerMw, loginMw } = require("../middleWares/authMw");

app.post("/register", registerMw, registerCon);
app.post("/login", loginMw, loginCon);

module.exports = app;
