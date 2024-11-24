const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlistController");

/**
 * @description find all videos under specific playlist
 * @url /playlist/{playlist_id}/find-all-videos
 */
router.get("/:id/find-all-videos", playlistController.findAllVideos);

module.exports = router;