const express = require("express");
const ServiceCategory = require("../models/ServiceCategory");

const router = express.Router();

//GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await ServiceCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
});

//POST a new category (for setup/admin use)
router.post("/", async (req, res) => {
  try {
    const category = await ServiceCategory.create({ name: req.body.name });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
});

module.exports = router;