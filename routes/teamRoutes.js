const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const upload = require('../middleware/upload');

// Verify team name and secret key
router.post('/verify-key', async (req, res) => {
  try {
    const { teamName, secretKey } = req.body;

    if (!teamName || !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Team name and secret key are required'
      });
    }

    const team = await Team.findOne({ teamName });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const isValid = team.secretKey === secretKey;

    res.json({
      success: true,
      isValid,
      message: isValid ? 'Valid team credentials' : 'Invalid secret key'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Step 1: Register team with empty players array
router.post('/register', async (req, res) => {
  try {
    const { teamName, batchYear, captainName, viceCaptainName } = req.body;

    // Validate required fields
    if (!teamName || !batchYear || !captainName || !viceCaptainName) {
      return res.status(400).json({
        success: false,
        message: 'Team name and year are required'
      });
    }

    // Check if team already exists
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team with this name already exists'
      });
    }

    // Create team with empty players array
    const newTeam = new Team({
      teamName,
      batchYear,
      captainName,
      viceCaptainName,
      secretKey: null,
      players: [] // Start with empty players array
    });

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

// Step 2: Update players for a team with images
router.put('/update-players/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const id = mongoose.Types.ObjectId.isValid(teamId)
      ? new mongoose.Types.ObjectId(teamId)
      : teamId;

    console.log('Looking for team with ID:', id);

    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid players data format',
          debug: {
            error: 'Failed to parse players JSON',
            rawPlayers: req.body.players
          }
        });
      }
    }

    if (!Array.isArray(players) || players.length !== 16) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 16 players are required',
        debug: {
          playersReceived: players,
          playersCount: players?.length
        }
      });
    }


    // Find and update the team in one operation
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { players: req.body.players },
      { new: true, runValidators: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or update failed',
        debug: {
          teamId: teamId,
          convertedId: id
        }
      });
    }

    console.log('Updated team:', updatedTeam);


    // Generate secret key if it doesn't exist
    if (!updatedTeam.secretKey) {
      const secretKey = Math.random().toString(36).substring(2, 10); // 8 characters
      updatedTeam.secretKey = secretKey;
      await updatedTeam.save();

      res.status(200).json({
        success: true,
        message: 'Players updated successfully',
        data: updatedTeam,
        secretKey: secretKey
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Players updated successfully',
        data: updatedTeam
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      debug: {
        errorType: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }
    });
  }
});

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find();
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;


