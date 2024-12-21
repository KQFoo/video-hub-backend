const db = require('../config/db');
const { playlist, video, user } = db.models;
const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({
    stdTTL: 36000, // Cache for 10 hours
    checkperiod: 6000 // Check for expired entries every 100 minutes
});

module.exports = {
    showTotalVideos: async (req, res) => {
        try {
            const playlist_id = req.params.id;

            const _playlist = await playlist.findByPk(playlist_id);

            // Check if playlist exists
            if (!_playlist) {
                return res.status(404).json({ message: "Playlist not found" });
            }

            // Count total videos in the playlist
            const totalVideos = await video.count({
                where: { playlist_id: playlist_id }
            });

            // Subscribe to realtime updates
            const io = req.app.get('io');
            io.to(`playlist-${playlist_id}`).emit('video-count-update', {
                playlist_id,
                total_videos: totalVideos
            });

            res.status(200).json({ 
                success: true,
                playlist_id,
                total_videos: totalVideos
            });

        } catch (error) {
            console.error('Error getting total videos:', error);
            res.status(500).json({ 
                success: false,
                message: "Error getting total videos count", 
                error: error.message 
            });
        }
    },

    findAllVideos: async (req, res) => {
        try {
            const playlist_id = req.params.id;
            const { username, email } = req.body;
            const filter = req.query.filter || 'default'; // default, mtol, ltom, oton

            const _playlist = await playlist.findByPk(playlist_id);

            // Check if playlist exists or not
            if (!_playlist) {
                return res.status(400).json({ message: "Playlist not found" });
            }

            const _user = await user.findOne({ where: { user_name: username, email: email } });

            // Check if user exists or not
            if (!_user) {
                return res.status(400).json({ message: "User not found" });
            }

            const user_id = _user.user_id;

            let videos = [];

            switch (filter) {
                case 'default':
                    videos = await video.findAll({ where: { playlist_id: playlist_id, user_id: user_id }, order: [['created_at', 'DESC']] });
                    break;
                case 'mtol':
                    videos = await video.findAll({ where: { playlist_id: playlist_id, user_id: user_id }, order: [['views', 'DESC']] });
                    break;
                case 'ltom':
                    videos = await video.findAll({ where: { playlist_id: playlist_id, user_id: user_id }, order: [['views', 'ASC']] });
                    break;
                case 'oton':
                    videos = await video.findAll({ where: { playlist_id: playlist_id, user_id: user_id }, order: [['created_at', 'ASC']] });
                    break;
                default:
                    videos = await video.findAll({ where: { playlist_id: playlist_id, user_id: user_id }, order: [['created_at', 'DESC']] });
                    break;
            }

            if (videos.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    data: [],
                    message: "No videos were found in this playlist" 
                });
            }

            res.status(200).json({
                success: true,
                data: videos
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    
    getPlaylistVideos: async (req, res) => {
        try {
            const playlist_id = req.params.playlist_id;
            const { 
                page = 1, 
                limit = 50, 
                order = 'created_at', 
                sort = 'DESC'
            } = req.query;
    
            // Validate input
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(Math.max(1, parseInt(limit)), 100);
            const offset = (pageNum - 1) * limitNum;
    
            // Create a more comprehensive cache key
            const cacheKey = `playlist:${playlist_id}:page:${pageNum}:limit:${limitNum}:order:${order}:sort:${sort}`;
    
            // Check cache first
            const cached = cache.get(cacheKey);
            if (cached) {
                console.log(`Returning cached playlist videos for ${cacheKey}`);
                return res.status(200).json(cached);
            }
    
            const playlistInfo = await playlist.findByPk(playlist_id, {
                attributes: ['playlist_id', 'playlist_name']
            });
            if (!playlistInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Playlist not found"
                });
            }
    
            const { count, rows: videos } = await video.findAndCountAll({
                where: { playlist_id: playlist_id },
                order: [[order, sort]],
                limit: limitNum,
                offset: offset,
                attributes: [
                    'video_id', 
                    'video_name', 
                    'video_path', 
                    'created_at', 
                    'thumbnail',
                    'views',
                    'v_random_id',
                    'last_watched',
                    'playlist_id'
                ]
            });
    
            const totalPages = Math.ceil(count / limitNum);
    
            const result = {
                success: true,
                playlist: {
                    id: playlistInfo.playlist_id,
                    name: playlistInfo.playlist_name
                },
                videos: videos,
                pagination: {
                    total: count,
                    page: pageNum,
                    pages: totalPages,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            };
    
            // Cache the results with a more specific TTL based on playlist size
            const cacheTTL = videos.length > 0 
                ? Math.min(36000, Math.max(3600, videos.length * 60)) // Dynamic TTL
                : 3600; // 1 hour default for empty playlists
    
            cache.set(cacheKey, result, cacheTTL);
            console.log(`Found and cached ${result.videos.length} videos for ${cacheTTL} seconds`);
    
            res.status(200).json(result);
    
        } catch (error) {
            console.error('Fetch playlist videos error:', error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    },
    
    // Add cache invalidation methods
    invalidatePlaylistCache: (playlist_id) => {
        const cacheKeyPattern = `playlist:${playlist_id}:`;
        
        // Get all keys matching the pattern
        const keysToDelete = cache.keys().filter(key => key.startsWith(cacheKeyPattern));
        
        // Delete matching keys
        keysToDelete.forEach(key => {
            cache.del(key);
            console.log(`Invalidated cache for key: ${key}`);
        });
    },
    
    // Call this method when videos are added, removed, or modified in a playlist
    updatePlaylistCache: async (playlist_id) => {
        try {
            // Invalidate existing cache
            this.invalidatePlaylistCache(playlist_id);
    
            // Optionally, pre-warm the cache for the first page
            await this.getPlaylistVideos({
                params: { playlist_id },
                query: { page: 1, limit: 50 }
            }, {
                status: () => ({ json: () => {} })
            });
        } catch (error) {
            console.error('Error updating playlist cache:', error);
        }
    }
}