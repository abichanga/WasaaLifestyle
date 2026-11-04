const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// ----- REGISTER -----
router.post(
  "/register",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required")
      .isLength({ max: 100 }).withMessage("Name too long"),
    body("email").trim().isEmail().withMessage("A valid email is required")
      .normalizeEmail(),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/[A-Za-z]/).withMessage("Password must include a letter")
      .matches(/[0-9]/).withMessage("Password must include a number"),
    body("role").isIn(["household", "provider", "admin"]).withMessage("Invalid role"),
  ],
  async (req, res) => {
    // check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { fullName, email, phone, password, role } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ fullName, email, phone, password: hashedPassword, role });

      res.status(201).json({ message: "User registered", userId: user._id });
    } catch (err) {
      console.error("Registration error:", err.message);   // log server-side
      res.status(500).json({ message: "Registration failed" });   // generic to client
    }
  }
);
//LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //compare submitted password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //create a token that proves who they are
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, role: user.role },
    });
    } catch (err) {
      console.error("Login error:", err.message);
      res.status(500).json({ message: "Login failed" });
    }
});

// ----- GET current logged-in user -----
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
});

// ----- UPDATE own account (name, email, phone) -----
router.patch("/me", protect, async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // if changing email, make sure it's not taken by someone else
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    res.json({ message: "Account updated", user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error("Account update error:", err.message);
    res.status(500).json({ message: "Update failed" });
  }
});

module.exports = router;