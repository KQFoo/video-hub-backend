const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlistController");

router.get("/:id", playlistController.findAllVideos);

module.exports = router;