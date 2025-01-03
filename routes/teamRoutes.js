const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

router.post('/register', async (req, res) => {
  try {
    const newTeam = new Team(req.body);
    await newTeam.save();
    res.status(201).json({
      success: true,
      message: 'Team registered successfully',
      data: newTeam
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 