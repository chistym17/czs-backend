const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Team = require('../models/Team');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

router.post('/verify-key', async (req, res) => {
  try {
    const { teamName, secretKey } = req.body;
    if (!teamName || !secretKey) {
      return res.status(400).json({ success: false, message: 'Team name and secret key are required' });
    }
    const team = await Team.findOne({ teamName });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    const isValid = team.secretKey === secretKey;
    res.json({ success: true, isValid, message: isValid ? 'Valid team credentials' : 'Invalid secret key' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { teamName, batchYear, captainName, viceCaptainName } = req.body;
    if (!teamName || !batchYear || !captainName || !viceCaptainName) {
      return res.status(400).json({ success: false, message: 'Team name and year are required' });
    }
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({ success: false, message: 'Team with this name already exists' });
    }
    const newTeam = new Team({
      teamName,
      batchYear,
      captainName,
      viceCaptainName,
      teamLogo: null,
      secretKey: null,
      isVerified: false,
      players: []
    });
    await newTeam.save();
    res.status(201).json({ success: true, message: 'Team registered successfully', data: newTeam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/update-players/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    let { players } = req.body;
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, message: 'Invalid team ID format' });
    }
    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
      } catch (parseError) {
        return res.status(400).json({ success: false, message: 'Invalid players data format' });
      }
    }
    const existingTeam = await Team.findById(teamId);
    if (!existingTeam) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    existingTeam.players = players;
    await existingTeam.save();
    if (!existingTeam.secretKey) {
      const secretKey = Math.random().toString(36).substring(2, 10);
      existingTeam.secretKey = secretKey;
      await existingTeam.save();
      return res.status(200).json({ success: true, message: 'Players updated successfully', data: existingTeam, secretKey });
    }
    res.status(200).json({ success: true, message: 'Players updated successfully', data: existingTeam });
  } catch (error) {
    console.error('Error updating players:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { isVerified } = req.query;
    let query = {};
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }
    const teams = await Team.find(query);
    res.status(200).json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/by-name/:teamName', async (req, res) => {
  try {
    const { teamName } = req.params;
    if (!teamName) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }
    const team = await Team.findOne({ teamName });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    const teamData = team.toObject();
    delete teamData.secretKey;
    res.status(200).json({ success: true, data: teamData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, batchYear, captainName, viceCaptainName } = req.body;
    if (!teamName || !batchYear || !captainName || !viceCaptainName) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    if (teamName !== team.teamName) {
      const existingTeam = await Team.findOne({ teamName });
      if (existingTeam) {
        return res.status(400).json({ success: false, message: 'Team name is already taken' });
      }
    }
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      { teamName, batchYear, captainName, viceCaptainName },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Team updated successfully', data: updatedTeam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/upload-team-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo file provided' });
    }
    const { teamId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    const result = await cloudinary.uploader.upload(req.file.path, { folder: 'team-logos' });
    team.teamLogo = result.secure_url;
    await team.save();
    res.status(200).json({ success: true, message: 'Team logo uploaded successfully', logoUrl: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;