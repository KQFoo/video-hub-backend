const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

/**
 * @route   POST /v/download
 * @desc    Download the video
 * @body    url={youtube_url}, playlist_id={playlist_id}
 */
router.post("/download", videoController.downloadVideo);

module.exports = router;