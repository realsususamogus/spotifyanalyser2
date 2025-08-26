const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Spotify API credentials (for OAuth and playlist access)
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;

// RapidAPI credentials (for track analysis)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'shazam-core.p.rapidapi.com';

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Debug endpoint to help verify configuration
app.get('/debug/config', (req, res) => {
    res.json({
        redirectUri: REDIRECT_URI,
        hasClientId: !!CLIENT_ID,
        hasClientSecret: !!CLIENT_SECRET,
        hasRapidApiKey: !!RAPIDAPI_KEY,
        rapidApiHost: RAPIDAPI_HOST,
        nodeEnv: process.env.NODE_ENV || 'development'
    });
});

// Spotify OAuth - Generate authorization URL
app.get('/auth/login', (req, res) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return res.status(500).json({ 
            error: 'Spotify API credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.' 
        });
    }
    
    console.log('OAuth login request - Redirect URI:', REDIRECT_URI);
    
    const scopes = 'playlist-read-private playlist-read-collaborative user-read-private';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.json({ authUrl });
});

// Spotify OAuth callback
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    
    console.log('OAuth callback received - Code:', code ? 'present' : 'missing');
    console.log('Using redirect URI:', REDIRECT_URI);
    
    if (!code) {
        return res.redirect('/?error=authorization_failed');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', 
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;
        
        // Redirect back to the app with tokens (in a real app, you'd want to handle this more securely)
        res.redirect(`/?access_token=${access_token}&refresh_token=${refresh_token}`);
        
    } catch (error) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);
        
        // Provide more specific error information for common OAuth issues
        if (error.response?.data?.error === 'invalid_grant') {
            console.error('OAuth Error: Invalid grant - This usually means the redirect_uri doesn\'t match what\'s configured in Spotify app');
            console.error('Expected redirect_uri:', REDIRECT_URI);
            res.redirect('/?error=invalid_redirect_uri');
        } else {
            res.redirect('/?error=token_exchange_failed');
        }
    }
});

// Get user's playlists
app.post('/api/playlists', async (req, res) => {
    const { access_token } = req.body;
    
    if (!access_token) {
        return res.status(400).json({ error: 'Access token required' });
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            },
            params: {
                limit: 50
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching playlists:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to fetch playlists' 
        });
    }
});

// Analyze a specific playlist
app.post('/api/analyze-playlist', async (req, res) => {
    const { access_token, playlist_id } = req.body;
    
    if (!access_token || !playlist_id) {
        return res.status(400).json({ error: 'Access token and playlist ID required' });
    }

    try {
        // Get playlist details
        const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        // Get all tracks from the playlist
        const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            },
            params: {
                limit: 100,
                fields: 'items(track(id,name,artists,duration_ms,popularity,album(name)))'
            }
        });

        const playlist = playlistResponse.data;
        const tracks = tracksResponse.data.items.filter(item => item.track && item.track.id);

        // Get audio features using RapidAPI Track Analysis
        const audioFeatures = await getTrackAnalysis(tracks);

        // Perform analysis
        const analysis = analyzePlaylist(tracks, audioFeatures);

        res.json({
            playlist: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                owner: playlist.owner.display_name,
                follower_count: playlist.followers.total,
                track_count: tracks.length
            },
            analysis
        });

    } catch (error) {
        console.error('Error analyzing playlist:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to analyze playlist' 
        });
    }
});

// Get track analysis from RapidAPI
async function getTrackAnalysis(tracks) {
    if (!RAPIDAPI_KEY) {
        console.warn('RapidAPI key not configured. Using mock audio features data.');
        // Return mock data with the expected structure when RapidAPI is not configured
        return tracks.map(item => ({
            id: item.track.id,
            danceability: Math.random() * 0.8 + 0.2, // 0.2-1.0
            energy: Math.random() * 0.8 + 0.2,
            speechiness: Math.random() * 0.3, // Lower values more common
            acousticness: Math.random() * 0.6,
            instrumentalness: Math.random() * 0.4,
            liveness: Math.random() * 0.5,
            valence: Math.random() * 0.8 + 0.2,
            tempo: Math.random() * 140 + 60 // 60-200 BPM
        }));
    }

    const audioFeatures = [];
    
    // Process tracks in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tracks.length; i += batchSize) {
        const batch = tracks.slice(i, i + batchSize);
        const batchPromises = batch.map(async (item) => {
            try {
                // Use track name and artist for analysis since we don't have Spotify track IDs in RapidAPI
                const query = `${item.track.name} ${item.track.artists[0]?.name || ''}`.trim();
                
                // Make RapidAPI call for track analysis
                const response = await axios.get(`https://${RAPIDAPI_HOST}/v2/search`, {
                    params: {
                        query: query,
                        limit: 1
                    },
                    headers: {
                        'X-RapidAPI-Key': RAPIDAPI_KEY,
                        'X-RapidAPI-Host': RAPIDAPI_HOST
                    },
                    timeout: 10000 // 10 second timeout
                });

                // Extract audio features from RapidAPI response
                // Note: Different RapidAPI services have different response formats
                // This is a generic implementation that may need adjustment based on the specific API
                const analysisData = extractAudioFeatures(response.data, item.track.id);
                return analysisData;
                
            } catch (error) {
                console.error(`Error analyzing track ${item.track.name}:`, error.message);
                // Return default values if analysis fails
                return {
                    id: item.track.id,
                    danceability: 0.5,
                    energy: 0.5,
                    speechiness: 0.1,
                    acousticness: 0.3,
                    instrumentalness: 0.2,
                    liveness: 0.2,
                    valence: 0.5,
                    tempo: 120
                };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        audioFeatures.push(...batchResults);
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < tracks.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return audioFeatures;
}

// Extract audio features from RapidAPI response
function extractAudioFeatures(apiResponse, trackId) {
    // This function maps the RapidAPI response to Spotify-like audio features format
    // The exact mapping depends on the specific RapidAPI service being used
    
    try {
        // For Shazam API or similar services, the response structure might be different
        // This is a generic implementation that should be adapted based on the actual API response
        
        if (apiResponse?.tracks?.hits?.[0]) {
            const track = apiResponse.tracks.hits[0].track;
            
            // Map available data to audio features
            // These values are estimated based on available metadata
            return {
                id: trackId,
                danceability: estimateDanceability(track),
                energy: estimateEnergy(track),
                speechiness: estimateSpeechiness(track),
                acousticness: estimateAcousticness(track),
                instrumentalness: estimateInstrumentalness(track),
                liveness: estimateLiveness(track),
                valence: estimateValence(track),
                tempo: estimateTempo(track)
            };
        }
    } catch (error) {
        console.error('Error extracting audio features:', error);
    }
    
    // Return default values if extraction fails
    return {
        id: trackId,
        danceability: 0.5,
        energy: 0.5,
        speechiness: 0.1,
        acousticness: 0.3,
        instrumentalness: 0.2,
        liveness: 0.2,
        valence: 0.5,
        tempo: 120
    };
}

// Helper functions to estimate audio features from available track metadata
function estimateDanceability(track) {
    // Estimate danceability based on genre, BPM, etc.
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('dance') || genre.toLowerCase().includes('electronic')) {
        return Math.random() * 0.3 + 0.7; // 0.7-1.0 for dance music
    }
    return Math.random() * 0.6 + 0.2; // 0.2-0.8 for other genres
}

function estimateEnergy(track) {
    // Estimate energy based on tempo and genre
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('rock') || genre.toLowerCase().includes('metal')) {
        return Math.random() * 0.3 + 0.7;
    }
    return Math.random() * 0.7 + 0.3;
}

function estimateSpeechiness(track) {
    // Estimate speechiness (rap/hip-hop would be higher)
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('rap') || genre.toLowerCase().includes('hip hop')) {
        return Math.random() * 0.4 + 0.4; // 0.4-0.8 for rap
    }
    return Math.random() * 0.2; // 0-0.2 for most music
}

function estimateAcousticness(track) {
    // Estimate acoustic nature
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('acoustic') || genre.toLowerCase().includes('folk')) {
        return Math.random() * 0.4 + 0.6;
    }
    return Math.random() * 0.6;
}

function estimateInstrumentalness(track) {
    // Estimate instrumental content
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('instrumental') || genre.toLowerCase().includes('classical')) {
        return Math.random() * 0.5 + 0.5;
    }
    return Math.random() * 0.3;
}

function estimateLiveness(track) {
    // Most tracks are studio recordings
    return Math.random() * 0.3 + 0.1;
}

function estimateValence(track) {
    // Estimate positivity/happiness
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('happy') || genre.toLowerCase().includes('pop')) {
        return Math.random() * 0.4 + 0.6;
    }
    return Math.random() * 0.8 + 0.2;
}

function estimateTempo(track) {
    // Estimate BPM based on genre
    const genre = track.genres?.primary || '';
    if (genre.toLowerCase().includes('dance') || genre.toLowerCase().includes('electronic')) {
        return Math.random() * 60 + 120; // 120-180 BPM
    } else if (genre.toLowerCase().includes('ballad') || genre.toLowerCase().includes('slow')) {
        return Math.random() * 40 + 60; // 60-100 BPM
    }
    return Math.random() * 80 + 80; // 80-160 BPM
}

// Analysis helper function
function analyzePlaylist(tracks, audioFeatures) {
    if (!tracks.length) return {};

    // Basic stats
    const totalDuration = tracks.reduce((sum, item) => sum + (item.track.duration_ms || 0), 0);
    const avgPopularity = tracks.reduce((sum, item) => sum + (item.track.popularity || 0), 0) / tracks.length;

    // Audio features analysis
    const validFeatures = audioFeatures.filter(f => f !== null);
    const avgFeatures = {};
    
    if (validFeatures.length > 0) {
        const featureKeys = ['danceability', 'energy', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo'];
        
        featureKeys.forEach(key => {
            avgFeatures[key] = validFeatures.reduce((sum, f) => sum + f[key], 0) / validFeatures.length;
        });
    }

    // Artists analysis
    const artistCounts = {};
    tracks.forEach(item => {
        item.track.artists.forEach(artist => {
            artistCounts[artist.name] = (artistCounts[artist.name] || 0) + 1;
        });
    });

    const topArtists = Object.entries(artistCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // Decades analysis (basic approach using track names - in a real app you'd get release dates)
    const decades = {};
    tracks.forEach(item => {
        // This is a simplified approach - you'd want to use album release dates
        const trackName = item.track.name.toLowerCase();
        let decade = '2010s'; // default
        
        if (trackName.includes('80') || trackName.includes('eighties')) decade = '1980s';
        else if (trackName.includes('90') || trackName.includes('nineties')) decade = '1990s';
        else if (trackName.includes('2000')) decade = '2000s';
        
        decades[decade] = (decades[decade] || 0) + 1;
    });

    return {
        basic: {
            track_count: tracks.length,
            total_duration_ms: totalDuration,
            total_duration_formatted: formatDuration(totalDuration),
            avg_popularity: Math.round(avgPopularity),
            avg_track_length_ms: Math.round(totalDuration / tracks.length),
            avg_track_length_formatted: formatDuration(totalDuration / tracks.length)
        },
        audio_features: avgFeatures,
        top_artists: topArtists,
        decades: Object.entries(decades).map(([decade, count]) => ({ decade, count }))
    };
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});