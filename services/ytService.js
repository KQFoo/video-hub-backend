const { google } = require('googleapis');
const { models } = require('../config/db');
const NodeCache = require('node-cache');

// Initialize YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Cache configuration
const cache = new NodeCache({
    stdTTL: 3600, // Cache for 1 hour
    checkperiod: 600 // Check for expired entries every 10 minutes
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class YouTubeService {
    /**
     * Retry a function with exponential backoff
     */
    async retry(fn, retries = MAX_RETRIES) {
        try {
            return await fn();
        } catch (error) {
            if (retries === 0) throw error;
            
            // Check if error is quota-related
            if (error.code === 403) {
                console.error('YouTube API quota exceeded');
                throw error; // Don't retry quota errors
            }

            const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
            console.log(`Retrying after ${delay}ms... (${retries} retries left)`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retry(fn, retries - 1);
        }
    }

    /**
     * Find similar videos using YouTube API
     */
    async findSimilarVideos(videoId, limit = 5) {
        try {
            // Check cache first
            const cacheKey = `recommendations:${videoId}:${limit}`;
            const cached = cache.get(cacheKey);
            if (cached) {
                console.log('Returning cached recommendations');
                return cached;
            }

            // Get source video
            const sourceVideo = await models.video.findByPk(videoId);
            if (!sourceVideo) {
                throw new Error('Video not found');
            }

            console.log('Searching YouTube for:', sourceVideo.video_name);

            // Search YouTube with retry
            const searchResponse = await this.retry(async () => {
                return youtube.search.list({
                    part: 'snippet',
                    q: sourceVideo.video_name,
                    type: 'video',
                    videoCategoryId: '10', // Music category
                    maxResults: limit,
                    videoEmbeddable: 'true',
                    order: 'relevance'
                });
            });

            // Get video IDs
            const videoIds = searchResponse.data.items.map(item => item.id.videoId);

            // Get detailed video information with retry
            const detailsResponse = await this.retry(async () => {
                return youtube.videos.list({
                    part: 'snippet,statistics',
                    id: videoIds.join(',')
                });
            });

            // Process results
            const recommendations = detailsResponse.data.items.map(item => ({
                videoId: item.id,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                channelTitle: item.snippet.channelTitle,
                description: item.snippet.description,
                publishedAt: item.snippet.publishedAt,
                statistics: {
                    viewCount: parseInt(item.statistics.viewCount) || 0,
                    likeCount: parseInt(item.statistics.likeCount) || 0,
                    commentCount: parseInt(item.statistics.commentCount) || 0
                },
                url: `https://www.youtube.com/watch?v=${item.id}`
            }));

            // Cache the results
            cache.set(cacheKey, recommendations);
            console.log(`Found and cached ${recommendations.length} recommendations`);

            return recommendations;

        } catch (error) {
            console.error('Error finding similar videos:', error);
            throw error;
        }
    }

    /**
     * Clear cache for a specific video
     */
    clearCache(videoId) {
        const keys = cache.keys().filter(key => key.startsWith(`recommendations:${videoId}`));
        cache.del(keys);
        console.log(`Cleared cache for video ${videoId}`);
    }
}

module.exports = new YouTubeService();
