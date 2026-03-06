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

    // CORS middleware - Allow frontend to communicate with backend
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

    app.use(express.json());

    // Middleware to ensure JSON responses have correct headers
    app.use((req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      next();
    });

    app.use("/auth", authApp);
    app.use("/profile", profileApp);
    app.use("/blogs", blogApp);

    // Global error handler
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
