const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const musicService = require('../services/musicService');

/**
 * @description Test page for lyrics container
 * @url /music/test-lyrics
 */
router.get('/test-lyrics', (req, res) => {
    res.render('lyrics');
});

/**
 * @description Test lyrics fetching
 * @url /music/test-lyrics/fetch?artist={artist}&track={track}
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
 * @description Get music information (lyrics, artist info, track details)
 * @url /music/video/{video_id}/info
 * @returns {
 *   lyrics: { title, lyrics_url, thumbnail, artist, lyrics },
 *   artist: { name, bio, tags, similar_artists, stats },
 *   track: { name, artist, album, duration, listeners, playcount, tags }
 * }
 */
router.get('/video/:video_id/info', musicController.getMusicInfo);

module.exports = router;
