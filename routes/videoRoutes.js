const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

/**
 * @rourte  POST /videos/upload-cloud
 * @desc    Upload video to cloud
 * @body    url={url}, playlist_id={playlist_id}, username={username}, email={email}
 */
router.post("/upload-cloud", videoController.downloadVideoIntoCloud);

/**
 * @route   GET /videos/info?url={youtube_url}
 * @desc    Fetch original video info
 * @query   youtube_url
 */
router.get("/info", videoController.fetchVideoInfo);

/**
 * @route   GET /videos/{video_id}/info
 * @desc    Get video info
 * @params  video_id
 */
router.get("/:video_id/info", videoController.getVideoInfo);

/**
 * @route   GET /videos/{video_id}/display
 * @desc    Display the video
 * @params  video_id
 */
router.get("/display/:video_id", videoController.displayVideo);

/**
 * @route   PUT /videos/{video_id}/rename
 * @desc    Rename the video
 * @params  video_id
 * @body    video_name={video_name}
 */
router.put("/rename/:video_id", videoController.renameVideo);

/**
 * @route   GET /videos/{video_id}/cloud-url
 * @desc    Get cloud URL for video
 * @params  video_id
 */
router.get("/:video_id/cloud-url", videoController.getCloudUrl);

/**
 * @route   GET /videos/cloud-videos
 * @desc    Get cloud videos
 */
router.get('/cloud-videos', videoController.getCloudVideos);

/**
 * @route   GET /videos/search?query={search_query}&type={all/music/general}
 * @desc    Search anywhere
 * @query   query - search query
 * @query   type - all/music/general
 */
router.get("/search", videoController.searchVideo);

/**
 * @route   PUT /videos/{video_id}/increment-view
 * @desc    Increment view count
 * @params  video_id
 */
router.put("/:video_id/increment-view", videoController.incrementView);

/**
 * @route   POST /videos/retrieve-old
 * @desc    Retrieve old videos
 */
router.post("/retrieve-old", videoController.retrieveOld);

/**
 * @route   DELETE /videos/{video_id}/delete
 * @desc    Delete video
 * @params  video_id
 */
router.delete("/:video_id/delete", videoController.deleteVideo);

module.exports = router;
