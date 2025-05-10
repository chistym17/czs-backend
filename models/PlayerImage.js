const mongoose = require('mongoose');

const playerImageSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Team.players'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Team'
  },
  imageUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PlayerImage', playerImageSchema, 'player-images'); 