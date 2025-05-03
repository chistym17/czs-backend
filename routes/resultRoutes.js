const express = require("express");
const router = express.Router();
const Result = require("../models/Result");
const Fixture = require("../models/Fixture");

// Create result
router.post("/", async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();

    // Optional: update fixture status to completed
    await Fixture.findByIdAndUpdate(result.fixtureId, {
      status: "completed",
      score: result.score,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all results
router.get("/", async (req, res) => {
  const results = await Result.find().populate("fixtureId");
  res.json(results);
});

// Update result
router.put("/:id", async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete result
router.delete("/:id", async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
