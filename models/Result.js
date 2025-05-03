const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  fixtureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fixture",
    required: true,
    unique: true, // Only one result per fixture
  },
  teamA: String,
  teamB: String,
  score: String, // e.g., "2-1"
  winner: String, // or 'Draw'
  mvp: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Result", resultSchema);
