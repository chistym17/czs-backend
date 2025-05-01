const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const upload = require('../middleware/upload');

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

    // Create team with empty players array
    const newTeam = new Team({
      teamName,
      batchYear,
      captainName,
      viceCaptainName,
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
router.put('/update-players/:teamId', upload.array('playerImages', 16), async (req, res) => {
  try {
    console.log('Request received for teamId:', req.params.teamId);
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);

    const { teamId } = req.params;
    let players = req.body.players;
    const uploadedImages = req.files;

    // If players is a string, try to parse it
    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
        console.log('Parsed players array:', players);
      } catch (parseError) {
        console.error('Failed to parse players JSON:', parseError);
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

    console.log('Players array length:', players?.length);
    console.log('First player data:', players?.[0]);
    console.log('Number of uploaded images:', uploadedImages?.length);

    // Validate if players array has exactly 16 players
    if (!Array.isArray(players) || players.length !== 16) {
      console.log('Validation failed:', { players, length: players?.length });
      return res.status(400).json({
        success: false,
        message: 'Exactly 16 players are required',
        debug: {
          playersReceived: players,
          playersCount: players?.length
        }
      });
    }

    // Process uploaded images and update player data
    const processedPlayers = players.map((player, index) => {
      console.log(`Processing player ${index + 1}:`, player);
      // If there's an uploaded image for this player, use it
      if (uploadedImages && uploadedImages[index]) {
        console.log(`Found image for player ${index + 1}:`, uploadedImages[index]);
        return {
          ...player,
          image: uploadedImages[index].path
        };
      }
      // If no new image, keep the existing image or set to null
      return {
        ...player,
        image: player.image || null
      };
    });

    console.log('Processed players:', processedPlayers);

    // Find team and update players
    console.log('Updating team with teamId:', teamId);
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { players: processedPlayers },
      { new: true, runValidators: true }
    );

    console.log('Team update result:', updatedTeam);

    if (!updatedTeam) {
      console.log('Team not found for teamId:', teamId);
      return res.status(404).json({
        success: false,
        message: 'Team not found',
        debug: {
          teamId,
          processedPlayers
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Players updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Error in update-players:', error);
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