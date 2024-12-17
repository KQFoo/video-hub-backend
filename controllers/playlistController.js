const db = require('../config/db');
const { playlist, video, user } = db.models;

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
    }
}