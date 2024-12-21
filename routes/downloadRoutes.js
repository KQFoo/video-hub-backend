const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

/**
 * @route   POST /v/download
 * @desc    Download the video
 * @body    url={youtube_url}, playlist_id={playlist_id}, username={username}, email={email}
 */
router.post("/download", videoController.downloadVideo);

/**
 * @route   POST /v/access
 * @desc    Access the videos from specific folder
 * @body    folder_path={folder_path}, playlist_id={playlist_id}, username={username}, email={email}
 */
router.post("/access", videoController.accessFolder);

module.exports = router;