const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

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

// ----- REQUEST a password reset (sends email with a link) -----
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // always respond the same way, so attackers can't tell which emails exist
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    // make a random token, store a hashed version with a 1-hour expiry
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // the link points to your frontend reset page, with the raw token
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;

    await resend.emails.send({
      from: "WasaaLifestyle <onboarding@resend.dev>",
      to: email,
      subject: "Reset your WasaaLifestyle password",
      html: `<p>You requested a password reset.</p>
             <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
             <p>If you did not request this, ignore this email.</p>`,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot-password error:", err.message);
    res.status(500).json({ message: "Could not process request" });
  }
});

// ----- PERFORM the reset (using the token from the email link) -----
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters with a letter and a number" });
    }

    // hash the incoming token and find a matching, unexpired user
    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetToken: hashed,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }

    const bcrypt = require("bcryptjs");
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset. You can now sign in." });
  } catch (err) {
    console.error("Reset-password error:", err.message);
    res.status(500).json({ message: "Could not reset password" });
  }
});

module.exports = router;