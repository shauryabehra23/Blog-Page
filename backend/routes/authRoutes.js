const express = require("express");
const app = express.Router();
const { loginCon, registerCon } = require("../controllers/authControllers");
const { registerMw, loginMw, checkTokenMw } = require("../middleWares/authMw");

app.post("/register", registerMw, registerCon);
app.post("/login", checkTokenMw, loginMw, loginCon);

module.exports = app;
