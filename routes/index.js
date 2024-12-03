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

router.use("/videos", videoRoutes);       // Video Routes
router.use("/users", userRoutes);         // User Routes
router.use("/playlists", playlistRoutes); // Playlist Routes

// Standard CRUD Routes for all models
router.use("/api/users", generateCrudRoutes(models.user));
router.use("/api/videos", generateCrudRoutes(models.video));
router.use("/api/playlists", generateCrudRoutes(models.playlist));

module.exports = router;