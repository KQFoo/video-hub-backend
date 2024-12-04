const express = require('express');
const router = express.Router();
const { models } = require("../config/db");
const generateCrudRoutes = require("./crudRoutes");
const videoRoutes = require("./videoRoutes");
const userRoutes = require("./userRoutes");
const playlistRoutes = require("./playlistRoutes");
const musicRoutes = require("./musicRoutes");

// Default Main
router.get("/", (req, res) => {
    res.send("Hello, World!");
});

router.use("/videos", videoRoutes);       // Video Routes
router.use("/users", userRoutes);         // User Routes
router.use("/playlists", playlistRoutes); // Playlist Routes
router.use("/music", musicRoutes);        // Music Info Routes

// Standard CRUD Routes for all models
router.use("/api/users", generateCrudRoutes(models.user));
router.use("/api/videos", generateCrudRoutes(models.video));
router.use("/api/playlists", generateCrudRoutes(models.playlist));

module.exports = router;