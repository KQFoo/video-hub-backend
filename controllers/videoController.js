//const ytdl = require('ytdl-core');
//const ytDlp = require('yt-dlp-exec');
require('dotenv').config();
const ytdlp = require('ytdlp-nodejs');
const db = require('../config/db');
const { video, playlist, user } = db.models;
const { Op } = require("sequelize");
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { uploadToCloud, deleteFromCloud } = require('../config/cloudinary');
const { google } = require('googleapis');

// Initialize YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

function Str_Random(length) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    
    // Loop to generate characters for the specified length
    for (let i = 0; i < length; i++) {
        const randomInd = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomInd);
    }
    return result;
}

const generateVideoPath = async(playlistName, videoName) => {
    const downloadDir = path.join(os.homedir(), 'Downloads/VideoHub', `${playlistName}`);
    await fs.mkdir(downloadDir, { recursive: true });

    return path.join(downloadDir, videoName);
};

module.exports = {
    downloadVideo: async (req, res) => {
        try {
            const { url, playlist_id, username, email } = req.body;

            if(!url) {
                return res.status(400).json({
                    success: false, 
                    message: "URL is required"
                });
            }

            const _user = await user.findOne({ where: { user_name: username, email: email } });
            if (!_user) {
                return res.status(400).json({
                    success: false, 
                    message: "User not found"
                });
            }

            // Get video info using YouTube API
            const videoInfo = await youtube.videos.list({
                part: ['snippet', 'contentDetails'],
                id: [new URL(url).searchParams.get('v')]
            });

            if (!videoInfo.data.items || videoInfo.data.items.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Video not found' 
                });
            }

            const videoDetails = videoInfo.data.items[0];
            const videoTitle = videoDetails.snippet.title.replace(/[^\w\s]/gi, '');

            // Get playlist name
            const playlistInfo = await playlist.findByPk(playlist_id);
            if(!playlistInfo) {
                return res.status(401).json({
                    success: false, 
                    message: "Playlist not found"
                });
            }

            // const formatStrategies = [
            //     'mp4',
            //     'bv[height<=720][ext=mp4]+ba[ext=m4a]',
            // ];            

            // Use environment variable for base path
            // const downloadPath = process.env.VIDEO_STORAGE_PATH || path.join(os.tmpdir(), 'VideoHub');
            
            // Ensure download directory exists
            // await fs.mkdir(path.join(downloadPath, playlistInfo.playlist_name), { recursive: true });

            // const videoPath = generateVideoPath(playlistInfo.playlist_name, `${videoTitle}.mp4.webm`);

            const downloadDir = path.join(os.homedir(), 'Downloads/VideoHub', `${playlistInfo.playlist_name}`);
            await fs.mkdir(downloadDir, { recursive: true });

            // let downloadSuccess = false;
            let cloudData = null;

            try {
                await ytdlp.download(url, {
                    filter: "mergevideo",
                    quality: "360p",
                    format: "webm",
                    output: {
                        fileName: videoTitle + ".mp4",
                        outDir: downloadDir
                    }   

                })
                .on('progress', (data) => {
                    console.log(data);
                });

                // downloadSuccess = true;

                const videoRecord = await video.create({
                    user_id: _user.user_id,
                    playlist_id: playlist_id,
                    video_name: videoTitle,
                    link: url,
                    v_random_id: Str_Random(12),
                    video_path: downloadDir + '/' + videoTitle + '.mp4.webm',
                    cloud_url: cloudData?.url || null,
                    cloud_public_id: cloudData?.public_id || null,
                    downloaded: true,
                    thumbnail: videoDetails.snippet.thumbnails.high.url || null,
                    duration: parseInt(videoDetails.contentDetails.duration.split('PT')[1].split('S')[0])
                });

                res.status(200).json({
                    success: true,
                    message: "Video downloaded locally",
                    video: videoRecord
                });
            } catch (error) {
                console.error(`Download attempt failed:`, error.message);
            }

            // if (!downloadSuccess) {
            //     throw new Error('Could not download video with any format');
            // }

            // try {
            //     const maxRetries = 3;
            //     let retryCount = 0;

            //     while (!cloudData && retryCount < maxRetries) {
            //         // Exponential backoff
            //         const waitTime = Math.pow(2, retryCount) * 120000; // 2min, 4min, 8min
                    
            //         console.log(`Cloud upload attempt ${retryCount + 1}. Waiting ${waitTime/1000} seconds.`);
            //         await new Promise(resolve => setTimeout(resolve, waitTime));

            //         try {
            //             cloudData = await uploadToCloud(
            //                 videoPath, 
            //                 `VideoHub/User ${playlistInfo.user_id}/${playlistInfo.playlist_name}`
            //             );

            //             if (cloudData) {
            //                 console.log('Cloud upload successful');
            //                 break; // Exit loop on successful upload
            //             }
            //         } catch (uploadError) {
            //             console.error(`Cloud upload attempt ${retryCount + 1} failed:`, uploadError);
            //         }

            //         retryCount++;
            //     }

            //     // Throw error if all attempts fail
            //     if (!cloudData) {
            //         throw new Error('Failed to upload video to cloud after multiple attempts');
            //     }
            // } catch (error) {
            //     console.error('Cloud upload ultimately failed:', error);
            // }

            // Save to database

        } catch (error) {
            console.error('Download error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    accessFolder: async (req, res) => {
        try {
            const { folder_path, playlist_id, username, email, videoTitle, url, videoDetails } = req.body;

            const _user = await user.findOne({ where: { user_name: username, email: email } });
            if (!_user) {
                return res.status(400).json({
                    success: false, 
                    message: "User not found"
                });
            }  

            const playlistInfo = await playlist.findByPk(playlist_id);
            if(!playlistInfo) {
                return res.status(401).json({
                    success: false, 
                    message: "Playlist not found"
                }); 
            }

            let videoList = null;
            try {
                videoList = await fs.readdir(folder_path);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: "Folder not found"
                });
            }

            const videoRecords = await Promise.all(videoList.map(async (videoName) => {
                try {
                    return await video.create({
                        user_id: _user.user_id,
                        playlist_id: playlist_id,
                        video_name: videoName,
                        link: url,
                        v_random_id: Str_Random(12),
                        video_path: path.join(folder_path, videoName),
                        cloud_url: null,
                        cloud_public_id: null,
                        downloaded: true,
                        thumbnail: null,
                        duration: null
                    });
                } catch (createError) {
                    console.error(`Error creating video record for ${videoName}:`, createError);
                    return null;
                }
            }));

            const successfulVideoRecords = videoRecords.filter(record => record !== null);

            res.status(200).json({
                success: true,
                message: "Folder accessed successfully",
                videos: videoRecords,
                totalVideos: videoList.length,
                createdVideos: successfulVideoRecords.length,
            });

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

            // Extract video ID from URL
            const videoId = new URL(url).searchParams.get('v');

            if (!videoId) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid YouTube URL" 
                });
            }

            // Fetch video details from YouTube API
            const { data } = await youtube.videos.list({
                part: ['snippet', 'contentDetails', 'statistics'],
                id: [videoId]
            });

            if (!data.items || data.items.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Video not found' 
                });
            }

            const videoDetails = data.items[0];

            // Get additional details from ytdl-core for formats
            /* const ytdlInfo = await ytdl.getInfo(url); */

            // Parse duration from ISO 8601 format
            const parseDuration = (duration) => {
                const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
                const hours = parseInt(match[1]) || 0;
                const minutes = parseInt(match[2]) || 0;
                const seconds = parseInt(match[3]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
            };

            const info = {
                title: videoDetails.snippet.title,
                description: videoDetails.snippet.description,
                duration: parseDuration(videoDetails.contentDetails.duration),
                thumbnail: videoDetails.snippet.thumbnails.high.url,
                author: videoDetails.snippet.channelTitle,
                views: parseInt(videoDetails.statistics.viewCount),
                likes: parseInt(videoDetails.statistics.likeCount),
                publishedAt: videoDetails.snippet.publishedAt,
                /*formats: ytdlInfo.formats.map(format => ({
                    quality: format.qualityLabel,
                    container: format.container,
                    size: format.contentLength
                }))*/
            };

            res.status(200).json({
                success: true,
                info: info
            });
        } catch (error) {
            console.error('Error fetching video info:', error);
            res.status(500).json({ 
                success: false,
                message: 'Failed to retrieve video information',
                details: error.message 
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

            const playlistInfo = await playlist.findByPk(videoInfo.playlist_id);
            if (!playlistInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Playlist not found"
                });
            }

            res.status(200).sendFile(path.join(process.cwd(), `Downloads/VideoHub/${playlistInfo.playlist_name}`, `${videoInfo.video_name}`), (err) => {
                if (err) {
                    console.error('Video display error:', err);
                    res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }
            });
        } catch (error) {
            console.error('Video display error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },    

    renameVideo: async (req, res) => {
        try {
            const { video_id } = req.params;
            const { video_name } = req.body;

            const videoInfo = await video.findByPk(video_id);
            if (!videoInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found"
                });
            }

            const playlistInfo = await playlist.findByPk(videoInfo.playlist_id);
            if (!playlistInfo) {
                return res.status(404).json({
                    success: false,
                    message: "Playlist not found"
                });
            }

            const newPath = path.join(os.homedir(), 'Downloads/VideoHub', `${playlistInfo.playlist_name}`, `${video_name}.webm`);

            const updatedVideo = await video.update(
                {
                    video_name: video_name,
                    video_path: newPath,
                    updated_at: new Date()
                },
                {
                    where: { video_id: video_id }
                }
            );

            // Rename local file if it exists
            try {
                await fs.access(videoInfo.video_path);
                await fs.rename(videoInfo.video_path, newPath);
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: "Video rename failed"
                });
            }
        
            if (updatedVideo === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Video name not updated"
                });
            }

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
            console.log('Video rename error:', error);
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

            await video.update(
                {
                    views: videoInfo.views + 1,
                    last_watched: new Date(),
                    updated_at: new Date()
                },
                {
                    where: { video_id: video_id }
                }
            );

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

            const { username, email } = req.body;

            const _user = await user.findOne({ where: { user_name: username, email: email } });
            if (!_user) {
                return res.status(400).json({
                    success: false,
                    message: "User not found"
                });
            }

            const videos = await video.findAll({
                where: {
                    user_id: _user.user_id,
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
            const type = (req.query.type).toLowerCase() || 'all';

            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: "Query is required"
                });
            }

            const videoPlaylist = await playlist.findOne({
                where: {
                    playlist_name: type === 'music' ? 'Music' : 'General'
                }
            });

            if (!videoPlaylist) {
                return res.status(404).json({
                    success: false,
                    message: "Playlist not found"
                });
            }
            
            let results;
            switch (type) {
                case "all":
                    results = await video.findAll({
                        where: {
                            video_name: { [Op.like]: `${query}%` },
                            downloaded: true
                        },
                        limit: 10,
                        offset: 0
                    });
                    break;
                case "music":
                    results = await video.findAll({
                        where: {
                            video_name: { [Op.like]: `${query}%` },
                            downloaded: true,
                            playlist_id: videoPlaylist.playlist_id
                        },
                        limit: 10,
                        offset: 0
                    });
                    break;
                case "general":
                    results = await video.findAll({
                        where: {
                            video_name: { [Op.like]: `${query}%` },
                            downloaded: true,
                            playlist_id: videoPlaylist.playlist_id
                        },
                        limit: 10,
                        offset: 0
                    });
                    break;
            }

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