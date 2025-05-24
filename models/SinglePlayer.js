const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: false
  },
  batch: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Player', playerSchema);
