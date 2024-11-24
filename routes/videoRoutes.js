const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

/**
 * @description fetch video info & download the video
 * @url /video/info
 * @url /video/download
 */
router.get("/info", videoController.getVideoInfo);
router.get("/download", videoController.downloadVideo);

/**
 * @description search anywhere
 * @url /video/search?query={search_query}&type={all/saved/downloaded}
 */
router.get("/search", videoController.searchVideo);

/**
 * @description update video's playlist
 * @url /video/{video_id}/update-playlist/{playlist_id}
 */
router.put("/:video_id/update-playlist/:playlist_id", videoController.updatePlaylist);

module.exports = router;
