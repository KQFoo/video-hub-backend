const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

/**
 * @description fetch original video info
 * @url /video/info?url={youtube_url}
 */
router.get("/info", videoController.fetchVideoInfo);

/**
 * @description get video info
 * @url /video/{video_id}/info
 */
router.get("/:video_id/info", videoController.getVideoInfo);

/**
 * @description get video info
 * @url /video/info/{video_id}
 */
router.get('/info/:video_id', videoController.getVideoInfo);

/**
 * @description download the video
 * @url /video/download
 * @body url={youtube_url} playlist_id={playlist_id}
 */
router.post("/download", videoController.downloadVideo);

/**
 * @description display the video
 * @url /video/{video_id}/display
 */
router.get("/:video_id/display", videoController.displayVideo);

/**
 * @description rename the video
 * @url /video/{video_id}/rename
 * @body video_name={video_name}
 */
router.put("/:video_id/rename", videoController.renameVideo);

/**
 * @description display the video
 * @url /video/display/{video_id}
 */
router.get('/display/:video_id', videoController.displayVideo);

/**
 * @description get cloud URL for video
 * @url /video/{video_id}/cloud-url
 */
router.get("/:video_id/cloud-url", videoController.getCloudUrl);

/**
 * @description get cloud videos
 * @url /video/cloud-videos
 */
router.get('/cloud-videos', videoController.getCloudVideos);

/**
 * @description search anywhere
 * @url /video/search?query={search_query}&type={all/music/general}
 */
router.get("/search", videoController.searchVideo);

/**
 * @description increment view count
 * @url /video/{video_id}/increment-view
 */
router.put("/:video_id/increment-view", videoController.incrementView);

/**
 * @description retrieve old videos
 * @url /video/retrieve-old
 */
router.get("/retrieve-old", videoController.retrieveOld);

/**
 * @description delete video
 * @url /video/{video_id}/delete
 */
router.delete("/:video_id/delete", videoController.deleteVideo);

/**
 * @description update video's playlist
 * @url /video/{video_id}/update-playlist/{playlist_id}
 */
// router.put("/:video_id/update-playlist/:playlist_id", videoController.updatePlaylist);

module.exports = router;
