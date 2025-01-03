const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: [
      'GK',    

      'CB',    
      'RB',    
      'LB',    
      'RWB',   
      'LWB',   
      'SW',    

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
      'RF',    
      'LF'     
    ]
  },
  jerseyNumber: {
    type: Number,
    required: true
  },

});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  year: {
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
  players: [playerSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', teamSchema); 