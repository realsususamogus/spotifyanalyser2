# Project on hold until Spotify provides alternative API solutions  
Spotify deprecated 8 APIs in June and provided no alternative solutions. Thus I am unable to extract audio features required for this application to work. Reccobeats requires uploading audio files for the analysis, but that is too inefficient for playlists. 

# Spotify Playlist Analyzer

A web application that analyzes your Spotify playlists to provide insights about your music taste, including audio features, artist distribution, and listening patterns.

## Features

- 🎵 **Spotify OAuth Integration** - Secure login with your Spotify account
- 📊 **Playlist Analysis** - Detailed analysis of any of your playlists including:
  - Track count and total duration
  - Average popularity and track length
  - Audio features analysis (danceability, energy, valence, etc.)
  - Top artists distribution
  - Basic genre/decade insights
- 🎨 **Clean Interface** - Modern, responsive web design
- 🚀 **Deploy Ready** - Configured for deployment on Render

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **APIs**: 
  - Spotify Web API (for OAuth and playlist access)
  - ReccoBeats API (for audio features analysis)
- **Deployment**: Render-ready configuration


## How It Works

1. **Authentication**: Users log in with their Spotify account using OAuth 2.0
2. **Playlist Fetching**: The app fetches the user's playlists from Spotify API
3. **Data Analysis**: For each selected playlist, the app:
   - Fetches detailed track information
   - Retrieves audio features for all tracks
   - Analyzes patterns and calculates statistics
4. **Visualization**: Results are displayed with progress bars, charts, and statistics

## API Endpoints

- `GET /` - Main application page
- `GET /auth/login` - Initiate Spotify OAuth flow
- `GET /callback` - OAuth callback endpoint
- `POST /api/playlists` - Fetch user's playlists
- `POST /api/analyze-playlist` - Analyze specific playlist

## Project Structure

```
├── server.js              # Express server and API endpoints
├── package.json           # Node.js dependencies and scripts
├── .env.example           # Environment variables template
├── public/                # Static files
│   ├── index.html         # Main HTML page
│   ├── css/
│   │   └── styles.css     # CSS styles
│   └── js/
│       └── app.js         # Frontend JavaScript
└── README.md              # This file
```

## Features in Detail

### Audio Features Analysis
The app analyzes several audio features provided by Spotify:
- **Danceability**: How suitable a track is for dancing
- **Energy**: Intensity and power of the track
- **Valence**: Musical positivity (happiness/sadness)
- **Acousticness**: Whether the track is acoustic
- **Speechiness**: Presence of spoken words
- **Instrumentalness**: Whether a track contains vocals
- **Liveness**: Presence of a live audience

### Statistics Provided
- Total playlist duration
- Average track length
- Average popularity score
- Number of unique artists
- Top artists by track count

## Privacy & Security

- This app does not store any user data on servers
- All analysis is performed in real-time using Spotify's API
- OAuth tokens are only used during the session
- No personal information is collected or retained

## License

This project is licensed under the ISC License - see the package.json file for details.

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.