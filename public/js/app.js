class SpotifyAnalyzer {
    constructor() {
        this.accessToken = null;
        this.refreshToken = null;
        this.init();
    }

    init() {
        // Check for tokens in URL (after OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');

        if (error) {
            this.showError(`Authentication failed: ${error}`);
            return;
        }

        if (accessToken) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            this.showPlaylistSelection();
        } else {
            this.showLogin();
        }

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('login-btn').addEventListener('click', () => {
            this.login();
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            this.showPlaylistSelection();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            location.reload();
        });
    }

    async login() {
        try {
            const response = await fetch('/auth/login');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to initiate login');
            }
            
            const data = await response.json();
            window.location.href = data.authUrl;
        } catch (error) {
            this.showError(error.message || 'Failed to initiate login. Please check that the server is properly configured with Spotify API credentials.');
        }
    }

    showLogin() {
        this.hideAllSections();
        document.getElementById('login-section').style.display = 'block';
    }

    async showPlaylistSelection() {
        this.hideAllSections();
        document.getElementById('playlist-section').style.display = 'block';
        
        try {
            const response = await fetch('/api/playlists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_token: this.accessToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch playlists');
            }

            const data = await response.json();
            this.renderPlaylists(data.items);
            
        } catch (error) {
            this.showError('Failed to load playlists. Please try logging in again.');
        }
    }

    renderPlaylists(playlists) {
        const container = document.getElementById('playlists-container');
        const loading = document.getElementById('playlists-loading');
        
        loading.style.display = 'none';
        
        if (!playlists || playlists.length === 0) {
            container.innerHTML = '<p>No playlists found.</p>';
            return;
        }

        container.innerHTML = playlists.map(playlist => `
            <div class="playlist-item" onclick="analyzer.analyzePlaylist('${playlist.id}')">
                <img class="playlist-image" 
                     src="${playlist.images[0]?.url || '/images/default-playlist.png'}" 
                     alt="${playlist.name}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0yMCA0MEw0MCAzMEwyMCAyMFY0MFoiIGZpbGw9IiM5OTk5OTkiLz4KPC9zdmc+'"
                >
                <div class="playlist-info">
                    <h3>${playlist.name}</h3>
                    <p>${playlist.tracks.total} tracks • ${playlist.owner.display_name}</p>
                </div>
            </div>
        `).join('');
    }

    async analyzePlaylist(playlistId) {
        this.hideAllSections();
        document.getElementById('results-section').style.display = 'block';
        document.getElementById('analysis-loading').style.display = 'block';
        document.getElementById('analysis-results').innerHTML = '';
        document.getElementById('back-btn').style.display = 'none';

        try {
            const response = await fetch('/api/analyze-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_token: this.accessToken,
                    playlist_id: playlistId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze playlist');
            }

            const data = await response.json();
            this.renderAnalysis(data);
            
        } catch (error) {
            this.showError('Failed to analyze playlist. Please try again.');
        }
    }

    renderAnalysis(data) {
        const loading = document.getElementById('analysis-loading');
        const results = document.getElementById('analysis-results');
        const backBtn = document.getElementById('back-btn');

        loading.style.display = 'none';
        backBtn.style.display = 'inline-block';

        const { playlist, analysis } = data;

        results.innerHTML = `
            <div class="analysis-header">
                <h2>${playlist.name}</h2>
                <p>by ${playlist.owner} • ${analysis.basic.track_count} tracks</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Duration</h3>
                    <div class="stat-value">${analysis.basic.total_duration_formatted}</div>
                    <div class="stat-label">Hours of music</div>
                </div>
                <div class="stat-card">
                    <h3>Average Track Length</h3>
                    <div class="stat-value">${analysis.basic.avg_track_length_formatted}</div>
                    <div class="stat-label">Per song</div>
                </div>
                <div class="stat-card">
                    <h3>Average Popularity</h3>
                    <div class="stat-value">${analysis.basic.avg_popularity}</div>
                    <div class="stat-label">Out of 100</div>
                </div>
                <div class="stat-card">
                    <h3>Unique Artists</h3>
                    <div class="stat-value">${analysis.top_artists.length}</div>
                    <div class="stat-label">Different artists</div>
                </div>
            </div>

            ${this.renderAudioFeatures(analysis.audio_features)}
            ${this.renderTopArtists(analysis.top_artists)}
        `;
    }

    renderAudioFeatures(features) {
        if (!features || Object.keys(features).length === 0) {
            return '<p>Audio features not available for this playlist.</p>';
        }

        const featureLabels = {
            danceability: 'Danceability',
            energy: 'Energy',
            speechiness: 'Speechiness',
            acousticness: 'Acousticness',
            instrumentalness: 'Instrumentalness',
            liveness: 'Liveness',
            valence: 'Happiness',
            tempo: 'Tempo (BPM)'
        };

        return `
            <div class="feature-bars">
                <h3>Audio Features</h3>
                ${Object.entries(features).map(([key, value]) => {
                    if (key === 'tempo') {
                        // Normalize tempo to 0-1 scale (assuming 60-200 BPM range)
                        const normalizedValue = Math.min(Math.max((value - 60) / 140, 0), 1);
                        return `
                            <div class="feature-bar">
                                <div class="feature-label">${featureLabels[key] || key}</div>
                                <div class="feature-progress">
                                    <div class="feature-fill" style="width: ${normalizedValue * 100}%"></div>
                                </div>
                                <div class="feature-value">${Math.round(value)}</div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="feature-bar">
                                <div class="feature-label">${featureLabels[key] || key}</div>
                                <div class="feature-progress">
                                    <div class="feature-fill" style="width: ${value * 100}%"></div>
                                </div>
                                <div class="feature-value">${Math.round(value * 100)}%</div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
    }

    renderTopArtists(artists) {
        if (!artists || artists.length === 0) {
            return '<p>No artist data available.</p>';
        }

        return `
            <div class="top-artists">
                <h3>Top Artists</h3>
                ${artists.slice(0, 10).map(artist => `
                    <div class="artist-item">
                        <div class="artist-name">${artist.name}</div>
                        <div class="artist-count">${artist.count} songs</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showError(message) {
        this.hideAllSections();
        document.getElementById('error-section').style.display = 'block';
        document.getElementById('error-message').textContent = message;
    }

    hideAllSections() {
        const sections = ['login-section', 'playlist-section', 'results-section', 'error-section'];
        sections.forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
    }
}

// Initialize the app
const analyzer = new SpotifyAnalyzer();