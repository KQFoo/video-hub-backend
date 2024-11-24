const express = require("express");
const router = express.Router();
require("dotenv").config();
const { models } = require("../config/db");
const generateCrudRoutes = require("./crudRoutes");
const videoRoutes = require("./videoRoutes");
const userRoutes = require("./userRoutes");
const playlistRoutes = require("./playlistRoutes");

// Default Main
router.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Download View
router.get("/downloader", (req, res) => {
    res.render("index");
});

// Routes (Fetch video info, Download, Search anywhere, Update Playlist)
router.use("/video", videoRoutes);

// Routes (Find all playlists)
router.use("/user", userRoutes);

// Routes (Find all videos)
router.use("/playlist", playlistRoutes);

// Standard CRUD Routes for all models
router.use("/api/user", generateCrudRoutes(models.user));
router.use("/api/video", generateCrudRoutes(models.video));
router.use("/api/playlist", generateCrudRoutes(models.playlist));

module.exports = router;