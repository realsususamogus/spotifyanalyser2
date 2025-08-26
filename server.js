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

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Spotify OAuth - Generate authorization URL
app.get('/auth/login', (req, res) => {
    const scopes = 'playlist-read-private playlist-read-collaborative user-read-private';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.json({ authUrl });
});

// Spotify OAuth callback
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    
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
        res.redirect('/?error=token_exchange_failed');
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

        // Get audio features for all tracks
        const trackIds = tracks.map(item => item.track.id).join(',');
        const audioFeaturesResponse = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const audioFeatures = audioFeaturesResponse.data.audio_features;

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