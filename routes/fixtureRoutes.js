const express = require("express");
const router = express.Router();
const Fixture = require("../models/Fixture");

// Create fixture
router.post("/", async (req, res) => {
  try {
    const fixture = new Fixture(req.body);
    await fixture.save();
    res.status(201).json(fixture);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all fixtures
router.get("/", async (req, res) => {
  const fixtures = await Fixture.find().sort({ date: 1 });
  res.json(fixtures);
});

// Update fixture
router.put("/:id", async (req, res) => {
  try {
    const fixture = await Fixture.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(fixture);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete fixture
router.delete("/:id", async (req, res) => {
  try {
    await Fixture.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
