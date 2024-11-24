const ytdl = require('ytdl-core');
const { setTimeout } = require('timers/promises');
const db = require('../config/db');
const { video } = db.models;
const { Op } = require("sequelize");

const CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    DEFAULT_HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Range': 'bytes=0-',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'video',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site'
    }
};

async function downloadVideo(req, res) {
    const { url } = req.query;
    let { quality = 'highest' } = req.query;
    let retryCount = 0;

    while (retryCount < CONFIG.MAX_RETRIES) {
        try {
            console.log(`Attempt ${retryCount + 1} to download video:`, url);

            if (!ytdl.validateURL(url)) {
                return res.status(400).json({ error: 'Invalid YouTube URL' });
            }

            // Get fresh video info on each attempt
            const info = await ytdl.getInfo(url, {
                requestOptions: {
                    headers: CONFIG.DEFAULT_HEADERS
                }
            });

            // Get all formats with both video and audio
            const formats = info.formats.filter(format =>
                format.hasVideo &&
                format.hasAudio &&
                format.container === 'mp4'
            );

            if (formats.length === 0) {
                throw new Error('No suitable formats found with both video and audio');
            }

            // Sort formats by quality
            formats.sort((a, b) => {
                const getQualityNumber = (format) => {
                    if (!format.qualityLabel) return 0;
                    return parseInt(format.qualityLabel) || 0;
                };
                return getQualityNumber(b) - getQualityNumber(a);
            });

            // Select format based on quality preference
            let selectedFormat;
            if (quality === 'highest') {
                selectedFormat = formats[0];
            } else if (quality === 'lowest') {
                selectedFormat = formats[formats.length - 1];
            } else {
                selectedFormat = formats.find(f => f.qualityLabel === quality) || formats[0];
            }

            console.log('Selected format:', {
                quality: selectedFormat.qualityLabel,
                container: selectedFormat.container,
                hasAudio: selectedFormat.hasAudio,
                hasVideo: selectedFormat.hasVideo,
                url: selectedFormat.url ? 'Available' : 'Not available'
            });

            // Set headers
            const sanitizedTitle = info.videoDetails.title
                .replace(/[^\x00-\x7F]/g, '')
                .replace(/[^a-zA-Z0-9-_]/g, '_')
                .substring(0, 100);

            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp4"`);

            // Create stream with the selected format
            const stream = ytdl.downloadFromInfo(info, {
                format: selectedFormat,
                requestOptions: {
                    headers: CONFIG.DEFAULT_HEADERS
                }
            });

            // Handle stream events
            stream.on('error', async (error) => {
                console.error('Stream Error:', error);
                if (!res.headersSent) {
                    if (retryCount < CONFIG.MAX_RETRIES - 1) {
                        retryCount++;
                        console.log(`Retrying... Attempt ${retryCount + 1}`);
                        await setTimeout(CONFIG.RETRY_DELAY);
                    } else {
                        res.status(500).json({
                            error: 'Download failed',
                            details: error.message
                        });
                    }
                }
            });

            let downloadedBytes = 0;
            stream.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (downloadedBytes % (1024 * 1024) === 0) {
                    console.log(`Downloaded: ${downloadedBytes / (1024 * 1024)}MB`);
                }
            });

            stream.on('end', () => {
                console.log('Download completed');
            });

            // Handle client disconnect
            req.on('close', () => {
                stream.destroy();
                console.log('Client disconnected');
            });

            // Pipe the stream to response
            stream.pipe(res);
            return;

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount < CONFIG.MAX_RETRIES) {
                console.log(`Retrying in ${CONFIG.RETRY_DELAY}ms...`);
                await setTimeout(CONFIG.RETRY_DELAY);
                continue;
            }

            if (!res.headersSent) {
                return res.status(500).json({
                    error: 'Download failed after all retries',
                    details: error.message
                });
            }
        }
    }
}

module.exports = {
    downloadVideo,
    getVideoInfo: async (req, res) => {
        try {
            const { url } = req.query;

            if (!ytdl.validateURL(url)) {
                return res.status(400).json({ error: 'Invalid YouTube URL' });
            }

            const info = await ytdl.getInfo(url);

            const videoInfo = {
                title: info.videoDetails.title,
                thumbnails: info.videoDetails.thumbnails,
                lengthSeconds: info.videoDetails.lengthSeconds,
                viewCount: info.videoDetails.viewCount,
                author: {
                    name: info.videoDetails.author.name,
                    channel_url: info.videoDetails.author.channel_url
                },
                formats: info.formats
                    .filter(format => format.hasVideo && format.hasAudio)
                    .map(format => ({
                        quality: format.qualityLabel,
                        container: format.container,
                        hasAudio: format.hasAudio,
                        hasVideo: format.hasVideo,
                        itag: format.it
                    }))
            };

            return res.json(videoInfo);
        } catch (error) {
            console.error('Error getting video info:', error);
            return res.status(500).json({ error: 'Error getting video info' });
        }
    },

    searchVideo: async (req, res) => {
        try {
            const query = req.query.query;
            const type = req.query.type;

            if (!query) {
                return res.status(400).json("Search query not found");
            }

            let results;

            switch (type) {
                case "all":
                    results = await video.findAll({
                        where: {
                            video_name: { [Op.like]: `${query}%` },
                        },
                        limit: 10,
                        offset: 0
                    });
                    break;
                case "saved":
                    results = await video.findAll({
                        where: {
                            video_name: { [Op.like]: `${query}%` },
                            downloaded: false
                        },
                        limit: 10,
                        offset: 0
                    });
                    break;
                case "downloaded":
                    results = await video.findAll({
                        where: {
                            video_name: { [Op.like]: `${query}%` },
                            downloaded: true
                        },
                        limit: 10,
                        offset: 0
                    });
                    break;
            }

            if (results.length === 0) {
                return res.status(404).json("No videos were found");
            }

            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updatePlaylist: async (req, res) => {
        try {
            const video_id = req.params.video_id;
            const playlist_id = req.params.playlist_id;

            const _video = await video.findByPk(video_id);
            if (!_video) {
                return res.status(404).json({ message: "Video not found" });
            }

            const _playlist = await playlist.findByPk(playlist_id);
            if (!_playlist) {
                return res.status(404).json({ message: "Playlist not found" });
            }

            const updatedCount = await video.update(
                {
                    playlist_id: playlist_id
                },
                {
                    where: { video_id: video_id }
                }
            )

            if (updatedCount === 0) {
                return res.status(400).json({ message: "No changes made" });
            }

            const updatedVideo = await video.findByPk(video_id);
            res.status(200).json(updatedVideo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};