const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

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
      teamLogo: null,
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
    let { players } = req.body;

    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team ID format'
      });
    }

    // Parse players if it's a string
    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid players data format'
        });
      }
    }

    // First find the team to ensure it exists
    const existingTeam = await Team.findById(teamId);
    if (!existingTeam) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Update the team's players
    existingTeam.players = players;
    await existingTeam.save();

    // Generate secret key if it doesn't exist
    if (!existingTeam.secretKey) {
      const secretKey = Math.random().toString(36).substring(2, 10); // 8 characters
      existingTeam.secretKey = secretKey;
      await existingTeam.save();

      return res.status(200).json({
        success: true,
        message: 'Players updated successfully',
        data: existingTeam,
        secretKey: secretKey
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Players updated successfully',
      data: existingTeam
    });

  } catch (error) {
    console.error('Error updating players:', error);
    res.status(400).json({
      success: false,
      message: error.message
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

// Get team data by team name
router.get('/by-name/:teamName', async (req, res) => {
  try {
    const { teamName } = req.params;

    if (!teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    const team = await Team.findOne({ teamName });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Create a copy of the team data without the secret key
    const teamData = team.toObject();
    delete teamData.secretKey;

    res.status(200).json({
      success: true,
      data: teamData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update team information
router.put('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, batchYear, captainName, viceCaptainName } = req.body;

    // Validate required fields
    if (!teamName || !batchYear || !captainName || !viceCaptainName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if new team name is already taken by another team
    if (teamName !== team.teamName) {
      const existingTeam = await Team.findOne({ teamName });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'Team name is already taken'
        });
      }
    }

    // Update team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      {
        teamName,
        batchYear,
        captainName,
        viceCaptainName
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload team logo
router.post('/upload-team-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file provided'
      });
    }

    const { teamId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'team-logos',
    });

    team.teamLogo = result.secure_url;
    await team.save();

    res.status(200).json({
      success: true,
      message: 'Team logo uploaded successfully',
      logoUrl: result.secure_url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get('/team-logo/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    res.status(200).json({ success: true, data: team.teamLogo });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update player information
router.put('/:teamId/players/:playerId', async (req, res) => {
  try {
    const { teamId, playerId } = req.params;
    const { name, position, jerseyNumber, image } = req.body;

    // Validate required fields
    if (!name || !position || !jerseyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, position, and jersey number are required'
      });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Find player in team
    const playerIndex = team.players.findIndex(p => p._id.toString() === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Player not found in team'
      });
    }

    // Update player
    team.players[playerIndex] = {
      ...team.players[playerIndex],
      name,
      position,
      jerseyNumber,
      image: image || team.players[playerIndex].image
    };

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Player updated successfully',
      data: team.players[playerIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload player image
router.post('/upload-player-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { teamId, playerId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const playerIndex = team.players.findIndex(p => p._id.toString() === playerId);
    if (playerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Player not found in team'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'player-images',
    });

    team.players[playerIndex].image = result.secure_url;

    await team.save();

    res.status(200).json({
      success: true,
      message: 'Player image uploaded successfully',
      imageUrl: result.secure_url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get player image
router.get('/player-image/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const playerImage = await Team.findOne({ players: { $elemMatch: { _id: playerId } } });
    res.status(200).json({ success: true, data: playerImage });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



module.exports = router;


