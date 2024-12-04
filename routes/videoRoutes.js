const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

/**
 * @route   GET /video/info?url={youtube_url}
 * @desc    Fetch original video info
 * @query   youtube_url
 */
router.get("/info", videoController.fetchVideoInfo);

/**
 * @route   GET /video/{video_id}/info
 * @desc    Get video info
 * @params  video_id
 */
router.get("/:video_id/info", videoController.getVideoInfo);

/**
 * @route   POST /video/download
 * @desc    Download the video
 * @body    url={youtube_url}, playlist_id={playlist_id}
 */
router.post("/download", videoController.downloadVideo);

/**
 * @route   GET /video/{video_id}/display
 * @desc    Display the video
 * @params  video_id
 */
router.get("/:video_id/display", videoController.displayVideo);

/**
 * @route   PUT /video/{video_id}/rename
 * @desc    Rename the video
 * @params  video_id
 * @body    video_name={video_name}
 */
router.put("/:video_id/rename", videoController.renameVideo);

/**
 * @route   GET /video/{video_id}/cloud-url
 * @desc    Get cloud URL for video
 * @params  video_id
 */
router.get("/:video_id/cloud-url", videoController.getCloudUrl);

/**
 * @route   GET /video/cloud-videos
 * @desc    Get cloud videos
 */
router.get('/cloud-videos', videoController.getCloudVideos);

/**
 * @route   GET /video/search?query={search_query}&type={all/music/general}
 * @desc    Search anywhere
 * @query   query - search query
 * @query   type - all/music/general
 */
router.get("/search", videoController.searchVideo);

/**
 * @route   PUT /video/{video_id}/increment-view
 * @desc    Increment view count
 * @params  video_id
 */
router.put("/:video_id/increment-view", videoController.incrementView);

/**
 * @route   GET /video/retrieve-old
 * @desc    Retrieve old videos
 */
router.get("/retrieve-old", videoController.retrieveOld);

/**
 * @route   DELETE /video/{video_id}/delete
 * @desc    Delete video
 * @params  video_id
 */
router.delete("/:video_id/delete", videoController.deleteVideo);

module.exports = router;
