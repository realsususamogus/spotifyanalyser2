# Deployment Guide for Render

This guide will help you deploy the Spotify Playlist Analyzer to Render.

## Prerequisites

1. **GitHub Account** with this repository forked
2. **Render Account** ([render.com](https://render.com))
3. **Spotify Developer Account** with an app created

## Step 1: Prepare Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or select an existing one
3. Note down your **Client ID** and **Client Secret**
4. In the app settings, add the following to **Redirect URIs**:
   ```
   https://your-app-name.onrender.com/callback
   ```
   (Replace `your-app-name` with your actual Render service name)

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Fork this repository** to your GitHub account
2. **Log in to Render** and go to your dashboard
3. **Create a New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select this repository
4. **Configure the service**:
   - **Name**: Choose a unique name (e.g., `spotify-analyzer-yourname`)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" (or paid plan if preferred)

### Option B: Using render.yaml (Alternative)

If you prefer infrastructure-as-code:

1. The repository includes a `render.yaml` file
2. In Render dashboard, choose "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration

## Step 3: Configure Environment Variables

In your Render service dashboard, go to "Environment" and add:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SPOTIFY_CLIENT_ID` | `your_client_id` | Your Spotify app's Client ID |
| `SPOTIFY_CLIENT_SECRET` | `your_client_secret` | Your Spotify app's Client Secret |
| `REDIRECT_URI` | `https://your-app-name.onrender.com/callback` | OAuth callback URL |
| `NODE_ENV` | `production` | Environment setting |

**Important**: Replace `your-app-name` in the `REDIRECT_URI` with your actual Render service URL.

## Step 4: Deploy and Test

1. **Save** your environment variables
2. Render will automatically **deploy** your service
3. Once deployed, visit your app URL: `https://your-app-name.onrender.com`
4. **Test the login flow**:
   - Click "Login with Spotify"
   - Complete the OAuth authorization
   - Try analyzing a playlist

## Step 5: Update Spotify App Settings

1. Go back to your Spotify Developer Dashboard
2. In your app settings, ensure the **Redirect URI** matches exactly:
   ```
   https://your-app-name.onrender.com/callback
   ```
3. Save the changes

## Troubleshooting

### Common Issues

**"Spotify API credentials not configured"**
- Check that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set correctly
- Ensure there are no extra spaces in the values

**"Invalid redirect URI"**
- Verify the `REDIRECT_URI` environment variable matches exactly what's in your Spotify app
- Make sure the URL uses `https://` (not `http://`)

**Login redirects to error page**
- Check Render logs for detailed error messages
- Verify your Spotify app has the correct redirect URI configured

**"Failed to fetch playlists"**
- This usually indicates an issue with the access token
- Try logging out and logging in again

### Viewing Logs

To debug issues:
1. Go to your Render service dashboard
2. Click on "Logs" tab
3. Look for error messages during deployment or runtime

### Free Tier Limitations

Render's free tier has some limitations:
- Services may sleep after 15 minutes of inactivity
- 750 hours per month of runtime
- Services may take 1-2 minutes to wake up from sleep

For production use, consider upgrading to a paid plan.

## Updates and Maintenance

### Updating the App

1. Make changes to your forked repository
2. Push changes to GitHub
3. Render will automatically deploy the updates

### Monitoring

- Monitor your app through Render dashboard
- Check logs regularly for any errors
- Consider setting up uptime monitoring for production use

## Security Notes

- Never commit `.env` files to your repository
- Keep your Spotify Client Secret secure
- The app doesn't store user data, but monitor access logs
- Consider implementing rate limiting for production use

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Render's documentation
3. Check Spotify's Web API documentation
4. Open an issue in the GitHub repository