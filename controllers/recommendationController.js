const videoService = require('../services/ytService');
const { video: Video } = require('../config/db').models;

class RecommendationController {
    /**
     * Get YouTube recommendations for a video
     */
    async getRecommendations(req, res) {
        try {
            const { videoId } = req.params;
            const limit = parseInt(req.query.limit) || 5;

            console.log(`Getting recommendations for video ${videoId}, limit: ${limit}`);

            // Check if source video exists
            const sourceVideo = await Video.findByPk(videoId);
            if (!sourceVideo) {
                return res.status(404).json({
                    success: false,
                    message: 'Video not found'
                });
            }

            // Get YouTube recommendations
            const recommendations = await videoService.findSimilarVideos(videoId, limit);

            res.json({
                success: true,
                data: recommendations
            });

        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get recommendations'
            });
        }
    }
}

module.exports = new RecommendationController();
