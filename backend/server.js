// server.js - entry point for the WasaaLifestyle backend
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);

// ----- core middleware -----
app.use(cors());
app.use(express.json());

// ----- security middleware (must come BEFORE routes) -----
app.use(helmet());   // protective HTTP headers

// strip NoSQL-injection operators ($ and .) from request body/params
app.use((req, res, next) => {
  const scrub = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key in obj) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          scrub(obj[key]);
        }
      }
    }
  };
  scrub(req.body);
  scrub(req.params);
  scrub(req.query);
  next();
});

// general rate limit: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api", generalLimiter);

// stricter limit on auth routes: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later." },
});
app.use("/api/auth", authLimiter);

// ----- routes -----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/providers", require("./routes/providers"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/verification", require("./routes/verification"));


// test route
app.get("/", (req, res) => {
  res.send("WasaaLifestyle API is running");
});

// ----- connect & start -----
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });