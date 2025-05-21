const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false,
    default: null
  },
  position: {
    type: String,
    required: true,
    enum: [
      'GK',

      'CB',
      'RB',
      'LB',

      'CDM',
      'CM',
      'CAM',
      'RM',
      'LM',
      'RW',
      'LW',

      'CF',
      'ST',
      'SS',
    ]
  },
  jerseyNumber: {
    type: Number,
    required: false
  },
  goals: {
    type: Number,
    required: false,
    default: 0
  }
 
});

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true
  },
  batchYear: {
    type: Number,
    required: true
  },
  captainName: {
    type: String,
    required: true

  },
  viceCaptainName: {
    type: String,
    required: true
  },
  teamLogo: {
    type: String,
    required: false
  },
  secretKey: {
    type: String,
    required: false
  },
  isVerified: {
    type: Boolean,
    required: false,
    default: false
  },
  players: [playerSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', teamSchema, 'teams'); 