const db = require('../config/db');
const { playlist, video } = db.models;

module.exports = {
    findAllVideos: async (req, res) => {
        try {
            const playlist_id = req.params.id;

            const _playlist = await playlist.findByPk(playlist_id);

            // Check if playlist exists or not
            if (!_playlist) {
                return res.status(400).json({ message: "Playlist not found" });
            }

            const videos = await video.findAll({ where: { playlist_id: playlist_id } });

            if (videos.length === 0) {
                return res.status(404).json({ message: "No videos were found" });
            }

            res.status(200).json(videos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}