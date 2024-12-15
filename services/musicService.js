const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({
    stdTTL: 36000, // Cache for 10 hours
    checkperiod: 6000 // Check for expired entries every 100 minutes
});

class MusicService {
    constructor() {
        this.geniusApiKey = process.env.GENIUS_API_KEY;
        this.lastfmApiKey = process.env.LASTFM_API_KEY;
    }

    async findLyrics(artist, track) {
        try {
            // Check cache first
            const cacheKey = `lyrics:${artist}:${track}`;
            const cached = cache.get(cacheKey);
            if (cached) {
                console.log('Returning cached lyrics');
                return cached;
            }

            const response = await axios.get(`https://api.genius.com/search`, {
                headers: {
                    'Authorization': `Bearer ${this.geniusApiKey}`
                },
                params: {
                    q: `${artist} ${track}`
                }
            });

            if (response.data.response.hits.length > 0) {
                const songInfo = response.data.response.hits[0].result;
                
                // Fetch the actual lyrics by scraping the page
                const lyricsPageResponse = await axios.get(songInfo.url);
                const $ = cheerio.load(lyricsPageResponse.data);
                
                // Extract lyrics from Genius page
                let lyrics = '';
                $('[data-lyrics-container="true"]').each((i, elem) => {
                    // Get the raw HTML content
                    const rawContent = $(elem).html();
                    // Replace <br> tags with newlines and decode HTML entities
                    lyrics += rawContent
                        .replace(/<br\s*\/?>/g, '\n')
                        .replace(/&nbsp;/g, ' ')
                        + '\n';
                });

                // Clean up the lyrics while preserving structure
                lyrics = lyrics
                    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
                    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
                    .trim();

                const result = {
                    success: true,
                    data: {
                        title: songInfo.title,
                        lyrics_url: songInfo.url,
                        thumbnail: songInfo.song_art_image_thumbnail_url,
                        artist: songInfo.primary_artist.name,
                        lyrics: lyrics || "Lyrics not available"
                    }
                };

                // Cache the results
                cache.set(cacheKey, result);
                console.log(`Found and cached lyrics for ${artist} - ${track}`);

                return result;
            }
            
            return {
                success: false,
                message: "No lyrics found for this song"
            };
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            return {
                success: false,
                message: "Error fetching lyrics",
                error: error.message
            };
        }
    }

    async getArtistInfo(artist) {
        try {
            // Check cache first
            const cacheKey = `artist:${artist}`;
            const cached = cache.get(cacheKey);
            if (cached) {
                console.log('Returning cached artist info');
                return cached;
            }

            const response = await axios.get(`http://ws.audioscrobbler.com/2.0/`, {
                params: {
                    method: 'artist.getInfo',
                    artist: artist,
                    api_key: this.lastfmApiKey,
                    format: 'json'
                }
            });

            if (response.data.artist) {
                const artistInfo = response.data.artist;

                const result = {
                    success: true,
                    data: {
                        name: artistInfo.name,
                        bio: artistInfo.bio.summary,
                        tags: artistInfo.tags.tag.map(t => t.name),
                        similar_artists: artistInfo.similar.artist.map(a => ({
                            name: a.name,
                            url: a.url
                        })),
                        stats: {
                            listeners: artistInfo.stats.listeners,
                            playcount: artistInfo.stats.playcount
                        }
                    }
                };

                // Cache the results
                cache.set(cacheKey, result);
                console.log(`Found and cached artist info for ${artist}`);

                return result;
            }

            return {
                success: false,
                message: "Artist not found"
            };
        } catch (error) {
            console.error('Error fetching artist info:', error);
            return {
                success: false,
                message: "Error fetching artist information",
                error: error.message
            };
        }
    }

    async getTrackInfo(artist, track) {
        try {
            // Check cache first
            const cacheKey = `track:${artist}:${track}`;
            const cached = cache.get(cacheKey);
            if (cached) {
                console.log('Returning cached track info');
                return cached;
            }

            const response = await axios.get(`http://ws.audioscrobbler.com/2.0/`, {
                params: {
                    method: 'track.getInfo',
                    artist: artist,
                    track: track,
                    api_key: this.lastfmApiKey,
                    format: 'json'
                }
            });

            if (response.data.track) {
                const trackInfo = response.data.track;

                const result = {
                    success: true,
                    data: {
                        name: trackInfo.name,
                        artist: trackInfo.artist.name,
                        album: trackInfo.album?.title,
                        duration: trackInfo.duration,
                        listeners: trackInfo.listeners,
                        playcount: trackInfo.playcount,
                        tags: trackInfo.toptags?.tag?.map(t => t.name) || []
                    }
                };

                // Cache the results
                cache.set(cacheKey, result);
                console.log(`Found and cached track info for ${artist} - ${track}`);

                return result;
            }

            return {
                success: false,
                message: "Track not found"
            };
        } catch (error) {
            console.error('Error fetching track info:', error);
            return {
                success: false,
                message: "Error fetching track information",
                error: error.message
            };
        }
    }

    extractArtistAndTrack(videoName) {
        // Handle common video title formats
        // Format 1: "Artist - Track"
        // Format 2: "Artist - Track (Official Video)"
        // Format 3: "Artist - Track [Official Music Video]"
        
        let cleanTitle = videoName
            .replace(/\(Official\s*Video\)/i, '')
            .replace(/\[Official\s*Music\s*Video\]/i, '')
            .replace(/\(Official\s*Music\s*Video\)/i, '')
            .replace(/\(Lyrics\)/i, '')
            .replace(/\[Lyrics\]/i, '')
            .trim();

        // console.log(cleanTitle);

        const parts = cleanTitle.split('-').map(part => part.trim());
        
        if (parts.length >= 2) {
            return {
                artist: parts[0],
                track: parts[1]
            };
        }

        return null;
    }
}

module.exports = new MusicService();
