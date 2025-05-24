const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const Player = require("../models/SinglePlayer");
const cloudinary = require("../config/cloudinary");

router.post("/register", upload.single("image"), async (req, res) => {
  try {
    const { name, batch, position, school } = req.body;
    let imageUrl = "";

    if (req.file && req.file.path) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "players",
      });
      imageUrl = result.secure_url;
    }

    const player = new Player({
      name,
      batch,
      position,
      image: imageUrl,
      school,
    });
    await player.save();
    res.status(201).json({ success: true, player });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/players", async (req, res) => {
  try {
    const players = await Player.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, players });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
