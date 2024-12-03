const ytdl = require('ytdl-core');
const ytDlp = require('yt-dlp-exec');
const db = require('../config/db');
const { video, playlist } = db.models;
const { Op } = require("sequelize");
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { uploadToCloud, deleteFromCloud } = require('../config/cloudinary');

module.exports = {
    downloadVideo: async (req, res) => {
        try {
            const { url, playlist_id } = req.body;

            if(!url) {
                return res.status(400).json({
                    success: false, 
                    message: "URL is required"
                });
            }

            // Get video info
            const videoInfo = await ytdl.getInfo(url);
            const videoTitle = videoInfo.videoDetails.title.replace(/[^\w\s]/gi, '');

            // Get playlist name
            const playlistInfo = await playlist.findByPk(playlist_id);
            if(!playlistInfo) {
                return res.status(401).json({
                    success: false, 
                    message: "Playlist not found"
                });
            }

            // Create downloads directory structure
            const downloadDir = path.join(os.homedir(), 'Downloads/VideoHub', playlistInfo.playlist_name);
            await fs.mkdir(downloadDir, { recursive: true });

            const videoPath = path.join(downloadDir, `${videoTitle}.mp4`);

            // Download video using yt-dlp
            try {
                await ytDlp(url, {
                    output: videoPath,
                    format: 'best[ext=mp4]'
                });

                // Upload to Cloudinary
                let cloudData = null;
                try {
                    cloudData = await uploadToCloud(videoPath, `VideoHub/${playlistInfo.playlist_name}`);
                } catch (error) {
                    console.error('Cloud upload failed:', error);
                    // Continue with local storage only
                }

                // Save to database
                const videoRecord = await video.create({
                    user_id: 1,
                    playlist_id: playlist_id,
                    video_name: videoTitle,
                    link: url,
                    video_path: videoPath,
                    cloud_url: cloudData?.url || null,
                    cloud_public_id: cloudData?.public_id || null,
                    downloaded: true,
                    thumbnail: videoInfo.videoDetails.thumbnails[0]?.url || null,
                    duration: videoInfo.videoDetails.lengthSeconds
                });

                res.status(200).json({
                    success: true,
                    message: cloudData ? "Video downloaded and uploaded to cloud" : "Video downloaded locally",
                    video: videoRecord
                });

            } catch (error) {
                return res.status(402).json({
                    success: false, 
                    message: "Video download failed",
                    error: error.message
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getVideoInfo: async (req, res) => {
        try {
            const { video_id } = req.params;

            const videoInfo = await video.findByPk(video_id);
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            res.status(200).json({
                success: true,
                info: videoInfo
            });

        } catch (error) {   
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    fetchVideoInfo: async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({ 
                    success: false,
                    message: "URL is required" 
                });
            }

            const videoInfo = await ytdl.getInfo(url);
            
            const info = {
                title: videoInfo.videoDetails.title,
                duration: videoInfo.videoDetails.lengthSeconds,
                thumbnail: videoInfo.videoDetails.thumbnails[0]?.url || null,
                author: videoInfo.videoDetails.author.name,
                views: videoInfo.videoDetails.viewCount,
                formats: videoInfo.formats.map(format => ({
                    quality: format.qualityLabel,
                    container: format.container,
                    size: format.contentLength
                }))
            };

            res.status(200).json({
                success: true,
                info: info
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    displayVideo: async (req, res) => {
        try {
            const { video_id } = req.params;

            const videoInfo = await video.findByPk(video_id);
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            try {
                await fs.access(videoInfo.video_path);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            res.status(200).sendFile(videoInfo.video_path, (err) => {
                if (err) {
                    res.status(404).json({
                        success: false,
                        message: "Video display failed"
                    });
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    incrementView: async (req, res) => {
        try {
            const { video_id } = req.params;

            const videoInfo = await video.findByPk(video_id);
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            const updatedCount = await video.update(
                {
                    views: videoInfo.views + 1,
                    last_watched: new Date(),
                    updated_at: new Date()
                },
                {
                    where: { video_id: video_id }
                }
            );

            if (updatedCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: "View count not updated"
                });
            }

            const updatedVideo = await video.findByPk(video_id);
            
            res.status(200).json({
                success: true,
                info: {
                    video_id: updatedVideo.video_id,
                    video_name: updatedVideo.video_name,
                    link: updatedVideo.link,
                    video_path: updatedVideo.video_path,
                    last_watched: updatedVideo.last_watched,
                    created_at: updatedVideo.created_at,
                    updated_at: updatedVideo.updated_at,
                    views: updatedVideo.views
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    retrieveOld: async (req, res) => {
        try {
            const videos = await video.findAll({
                where: {
                    downloaded: true,
                    last_watched: { [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                },
                limit: 10,
                offset: 0
            });

            if (videos.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No videos were found"
                });
            }

            res.status(200).json({
                success: true,
                info: videos
            }); 
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    deleteVideo: async (req, res) => {
        try {
            const { video_id } = req.params;

            const videoInfo = await video.findByPk(video_id);
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            // Delete from database
            const deletedCount = await video.destroy({
                where: { video_id: video_id }
            });

            if (deletedCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Video not deleted"
                });
            }

            // Delete local file
            try {
                await fs.unlink(videoInfo.video_path);
            } catch (error) {
                console.error('Error deleting local file:', error);
            }

            // Delete from cloud storage if exists
            if (videoInfo.cloud_public_id) {
                try {
                    await deleteFromCloud(videoInfo.cloud_public_id);
                } catch (error) {
                    console.error('Error deleting from cloud:', error);
                }
            }

            res.status(200).json({
                success: true,
                message: "Video deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    searchVideo: async (req, res) => {
        try {
            const query = req.query.query;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: "Query is required"
                });
            }
            
            const results = await video.findAll({
                where: {
                    video_name: { [Op.like]: `${query}%` },
                    downloaded: true
                },
                limit: 10,
                offset: 0
            });

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No results found"
                });
            }

            res.status(200).json({
                success: true,
                info: results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getCloudUrl: async (req, res) => {
        try {
            const { video_id } = req.params;

            const videoInfo = await video.findByPk(video_id);
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            if (!videoInfo.cloud_url) {
                return res.status(404).json({
                    success: false,
                    message: "Video not available in cloud storage"
                });
            }

            res.status(200).json({
                success: true,
                url: videoInfo.cloud_url
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    getCloudVideos: async (req, res) => {
        try {
            // Find all videos that have cloud URLs
            const cloudVideos = await video.findAll({
                where: {
                    cloud_url: {
                        [Op.ne]: null
                    }
                },
                attributes: ['video_id', 'video_name', 'cloud_url', 'thumbnail', 'duration'],
                order: [['created_at', 'DESC']]
            });

            res.status(200).json({
                success: true,
                count: cloudVideos.length,
                videos: cloudVideos.map(v => ({
                    id: v.video_id,
                    name: v.video_name,
                    url: v.cloud_url,
                    thumbnail: v.thumbnail,
                    duration: v.duration
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};