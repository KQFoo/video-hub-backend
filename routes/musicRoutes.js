const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const musicService = require('../services/musicService');

/**
 * @route   GET /music/test-lyrics
 * @desc    Test page for lyrics container
 */
router.get('/test-lyrics', (req, res) => {
    res.render('lyrics');
});

/**
 * @route   GET /music/test-lyrics/fetch?artist={artist}&track={track}
 * @desc    Test lyrics fetching
 * @query   artist
 * @query   track
 */
router.get('/test-lyrics/fetch', async (req, res) => {
    try {
        const { artist, track } = req.query;
        
        if (!artist || !track) {
            return res.render('lyrics', {
                error: 'Both artist and track are required'
            });
        }

        const result = await musicService.findLyrics(artist, track);
        
        if (!result.success) {
            return res.render('lyrics', {
                error: result.message || 'Failed to fetch lyrics'
            });
        }

        res.render('lyrics', {
            songInfo: result.data
        });

    } catch (error) {
        console.error('Error in test lyrics:', error);
        res.render('lyrics', {
            error: 'An error occurred while fetching lyrics'
        });
    }
});

/**
 * @route   GET /music/video/{video_id}/info
 * @desc    Get music information (lyrics, artist info, track details)
 * @params  video_id
 * @returns {
 *   lyrics: { title, lyrics_url, thumbnail, artist, lyrics },
 *   artist: { name, bio, tags, similar_artists, stats },
 *   track: { name, artist, album, duration, listeners, playcount, tags }
 * }
 */
router.get('/video/:video_id/info', musicController.getMusicInfo);

module.exports = router;
