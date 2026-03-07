require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connect = require("./DB/db");
const authApp = require("./routes/authRoutes");
const profileApp = require("./routes/profileRoutes");
const blogApp = require("./routes/blogRoutes");

const startServer = async () => {
  try {
    await connect();
    const app = express();

    app.use(
      cors({
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
        ],
        credentials: true,
      }),
    );

    const shouldParseJson = (req) => {
      const contentType = req.headers["content-type"] || "";
      return !contentType.includes("multipart/form-data");
    };

    app.use((req, res, next) => {
      if (shouldParseJson(req)) {
        express.json()(req, res, next);
      } else {
        next();
      }
    });

    app.use((req, res, next) => {
      if (shouldParseJson(req)) {
        express.urlencoded({ extended: true })(req, res, next);
      } else {
        next();
      }
    });

    app.use("/auth", authApp);
    app.use("/profile", profileApp);
    app.use("/blogs", blogApp);

    app.use((err, req, res, next) => {
      console.error("Server Error:", err);
      res.status(500).json({
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    });

    app.listen(process.env.PORT, () =>
      console.log(`listening to port ${process.env.PORT}`),
    );
  } catch (err) {
    console.log(err.message);
  }
};

startServer();
