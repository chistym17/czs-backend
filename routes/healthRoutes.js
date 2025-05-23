const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

router.get("/", async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    services: {
      mongodb: "checking",
      cloudinary: "checking",
    },
  };

  try {
    if (mongoose.connection.readyState === 1) {
      healthcheck.services.mongodb = "connected";
    } else {
      healthcheck.services.mongodb = "disconnected";
      throw new Error("MongoDB is not connected");
    }

    try {
      await cloudinary.api.ping();
      healthcheck.services.cloudinary = "connected";
    } catch (error) {
      healthcheck.services.cloudinary = "error";
      throw new Error("Cloudinary connection failed");
    }

    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    res.status(503).json(healthcheck);
  }
});

module.exports = router;
