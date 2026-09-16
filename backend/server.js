//server.js - entry point for the WasaaLifestyle backend
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

//middleware
app.use(cors());              //allow the frontend to call this API
app.use(express.json());      //let the server read JSON request bodies
app.use("/api/auth", require("./routes/auth"));

//a simple test route so we can confirm the server runs
app.get("/", (req, res) => {
  res.send("WasaaLifestyle API is running");
});

//connect to MongoDB Atlas, then start the server
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