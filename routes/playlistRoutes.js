const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlistController");

/**
 * @description show total videos
 * @url /playlists/{playlist_id}/total-videos
 */
router.get("/:id/total-videos", playlistController.showTotalVideos);

/**
 * @description find all videos under specific playlist
 * @url /playlists/{playlist_id}/find-all-videos?filter={default/custom}
 * @default filter is 'newest to oldest'
 * @custom filter includes: 
 * @mtol 'most viewed to least viewed', 
 * @ltom 'least viewed to most viewed', 
 * @oton 'oldest to newest'
 */
router.get("/:id/find-all-videos", playlistController.findAllVideos);

module.exports = router;