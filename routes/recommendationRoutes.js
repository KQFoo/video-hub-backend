const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

/**
 * @route   GET /recommendations/:videoId?limit={limit}&stats={stats}
 * @desc    Get YouTube recommendations for a video
 * @params  videoId - ID of the video to get recommendations for
 * @query   limit - Number of recommendations to return (default: 5)
 * @query   stats - Include video statistics (default: true)
 */
router.get('/:videoId', recommendationController.getRecommendations);

module.exports = router;