const express = require("express");
const router = express.Router();
const playlistController = require("../controllers/playlistController");

/**
 * @route GET /playlists/{playlist_id}/total-videos
 * @desc Show total videos
 */
router.get("/:id/total-videos", playlistController.showTotalVideos);

/**
 * @route   GET /playlists/{playlist_id}/find-all-videos
 * @desc    Find all videos under specific playlist
 * @params  playlist_id
 * @query   filter - default/custom =>
 *              - default: filter is 'newest to oldest'
 *              - custom: filter includes => 
 *                      -> mtol: 'most viewed to least viewed', 
 *                      -> ltom: 'least viewed to most viewed', 
 *                      -> oton: 'oldest to newest'
 */
router.get("/:id/find-all-videos", playlistController.findAllVideos);

module.exports = router;