const playlist = require('../models/playlist');
const musicService = require('../services/musicService');
const { video } = require('../config/db').models;

module.exports = {
    getMusicInfo: async (req, res) => {
        try {
            const { video_id } = req.params;
            
            const videoInfo = await video.findByPk(video_id, {
                where: {
                    playlist_id: 1 // Hardcoded playlist ID for music
                }
            });
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            // Extract artist and track from video name
            const songInfo = musicService.extractArtistAndTrack(videoInfo.video_name);
            if (!songInfo) {
                return res.status(400).json({
                    success: false,
                    message: "Could not extract artist and track information from video title"
                });
            }

            // Fetch lyrics, artist info, and track info in parallel
            const [lyrics, artistInfo, trackInfo] = await Promise.all([
                musicService.findLyrics(songInfo.artist, songInfo.track),
                musicService.getArtistInfo(songInfo.artist),
                musicService.getTrackInfo(songInfo.artist, songInfo.track)
            ]);

            res.status(200).json({
                success: true,
                video_id: video_id,
                video_name: videoInfo.video_name,
                extracted_info: songInfo,
                music_info: {
                    lyrics: lyrics.data,
                    artist: artistInfo.data,
                    track: trackInfo.data
                }
            });

        } catch (error) {
            console.error('Error in getMusicInfo:', error);
            res.status(500).json({
                success: false,
                message: "Error retrieving music information",
                error: error.message
            });
        }
    }
};
