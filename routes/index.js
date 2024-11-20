const express = require("express");
const router = express.Router();

const generateCrudRoutes = require("./crudRoutes");
const playlistRoutes = require("./playlistRoutes");
const userRoutes = require("./userRoutes");

const { models } = require("../config/db");

router.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Extra Routes
router.use("/user/findallplaylists", userRoutes);
router.use("/playlist/findallvideos", playlistRoutes);

// Standard CRUD Routes for all models
router.use("/user", generateCrudRoutes(models.user));
router.use("/video", generateCrudRoutes(models.video));
router.use("/playlist", generateCrudRoutes(models.playlist));

module.exports = router;