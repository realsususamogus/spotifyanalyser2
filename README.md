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
- **APIs**: Spotify Web API
- **Deployment**: Render-ready configuration

## Setup Instructions

### Prerequisites

1. **Spotify Developer Account**: You'll need to create a Spotify app to get API credentials
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Note your Client ID and Client Secret
   - Add redirect URI: `http://localhost:3000/callback` (for local development)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd spotifyanalyser2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your Spotify credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   REDIRECT_URI=http://localhost:3000/callback
   PORT=3000
   ```

4. **Run the application**:
   ```bash
   npm start
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

### Deployment on Render

1. **Fork this repository** to your GitHub account

2. **Create a new Web Service** on [Render](https://render.com):
   - Connect your GitHub repository
   - Use the following settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

3. **Set Environment Variables** in Render dashboard:
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret
   - `REDIRECT_URI`: `https://your-app-name.onrender.com/callback`

4. **Update Spotify App Settings**:
   - Go to your Spotify app in the Developer Dashboard
   - Add your Render URL to the Redirect URIs: `https://your-app-name.onrender.com/callback`

5. **Deploy** - Render will automatically deploy your app

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Privacy & Security

- This app does not store any user data on servers
- All analysis is performed in real-time using Spotify's API
- OAuth tokens are only used during the session
- No personal information is collected or retained

## License

This project is licensed under the ISC License - see the package.json file for details.

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.