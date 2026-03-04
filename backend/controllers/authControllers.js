const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginCon = async (req, res) => {
  try {
    if (req.loggedIn) {
      return res.status(200).json({
        message: "Already Logged In",
      });
    }
    const user = await userModel.findOne({ email: req.body.email });
    var token = -1;
    if (!user) {
      return res.status(404).json({
        message: "Wanna Sign Up!",
      });
    }
    const isPwCorrect = await bcrypt.compare(req.body.password, user.password);
    if (user && isPwCorrect) {
      token = jwt.sign({ user: user }, process.env.SECRET_KEY, {
        expiresIn: "24h",
      });
      return res.status(200).json({
        message: "VERIFIED!",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } else {
      return res.status(401).json({
        message: "Wrong PassWord!",
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "not your fault, promise problems",
    });
  }
};

const registerCon = async (req, res) => {
  try {
    const user = req.body;

    if (!user) {
      return res.status(405).json({
        message: "This should happen from the frontend",
      });
    }
    if (!(user.email && user.name && user.password)) {
      return res.status(405).json({
        message:
          "This should happen from the frontend, atleast get the input right",
      });
    }
    const isAlreadyPresent = await userModel.exists({ email: user.email });
    if (isAlreadyPresent) {
      return res.status(409).json({
        message: "try signing in",
      });
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const modifiedUser = {
      name: user.name,
      email: user.email,
      password: hashedPassword,
    };
    const newUser = new userModel(modifiedUser);
    await newUser.save();
    const token = jwt.sign({ user: newUser }, process.env.SECRET_KEY, {
      expiresIn: "24h",
    });
    return res.status(200).json({
      message: "Registered",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "sorry not your fault",
    });
  }
};

module.exports = { loginCon, registerCon };
