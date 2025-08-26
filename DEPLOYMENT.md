# Deployment Guide for Vercel

This guide will help you deploy the Spotify Playlist Analyzer to Vercel.

## Prerequisites

1. **GitHub Account** with this repository forked
2. **Vercel Account** ([vercel.com](https://vercel.com))
3. **Spotify Developer Account** with an app created

## Step 1: Prepare Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or select an existing one
3. Note down your **Client ID** and **Client Secret**
4. In the app settings, add the following to **Redirect URIs**:
   ```
   https://your-app-name.vercel.app/callback
   ```
   (Replace `your-app-name` with your actual Vercel deployment URL)

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Fork this repository** to your GitHub account
2. **Log in to Vercel** and go to your dashboard
3. **Import a New Project**:
   - Click "New Project"
   - Connect your GitHub account if not already connected
   - Select this repository
4. **Configure the project**:
   - **Project Name**: Choose a unique name (e.g., `spotify-analyzer-yourname`)
   - **Framework Preset**: Vercel will auto-detect Node.js
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: Leave default
   - **Install Command**: `npm install` (or leave default)

### Option B: Using Vercel CLI (Alternative)

If you prefer using the command line:

1. Install Vercel CLI: `npm i -g vercel`
2. In your project directory, run: `vercel`
3. Follow the prompts to configure your deployment

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to "Settings" → "Environment Variables" and add:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `SPOTIFY_CLIENT_ID` | `your_client_id` | Your Spotify app's Client ID |
| `SPOTIFY_CLIENT_SECRET` | `your_client_secret` | Your Spotify app's Client Secret |
| `REDIRECT_URI` | `https://your-app-name.vercel.app/callback` | OAuth callback URL |

**Important**: Replace `your-app-name` in the `REDIRECT_URI` with your actual Vercel deployment URL.

## Step 4: Deploy and Test

1. **Save** your environment variables
2. Vercel will automatically **redeploy** your service with the new variables
3. Once deployed, visit your app URL: `https://your-app-name.vercel.app`
4. **Test the login flow**:
   - Click "Login with Spotify"
   - Complete the OAuth authorization
   - Try analyzing a playlist

## Step 5: Update Spotify App Settings

1. Go back to your Spotify Developer Dashboard
2. In your app settings, ensure the **Redirect URI** matches exactly:
   ```
   https://your-app-name.vercel.app/callback
   ```
3. Save the changes

## Troubleshooting

### Common Issues

**"Spotify API credentials not configured"**
- Check that `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set correctly in Vercel
- Ensure there are no extra spaces in the values
- Redeploy after setting environment variables

**"Invalid redirect URI" / "String did not match expected pattern"**
- Verify the `REDIRECT_URI` environment variable matches exactly what's in your Spotify app
- Make sure the URL uses `https://` (not `http://`)
- Ensure there are no trailing spaces in the `REDIRECT_URI` value
- The format must be: `https://your-exact-domain.vercel.app/callback`
- Check the debug endpoint: `https://your-app-name.vercel.app/debug/config` to verify current configuration

**Login redirects to error page**
- Check Vercel function logs for detailed error messages
- Verify your Spotify app has the correct redirect URI configured  
- If you see "invalid_redirect_uri" error, the redirect URI in your environment doesn't match your Spotify app settings

**"Failed to fetch playlists"**
- This usually indicates an issue with the access token
- Try logging out and logging in again

### Step-by-Step Redirect URI Fix

If you're getting redirect URI errors:

1. **Check your current configuration**: Visit `https://your-app-name.vercel.app/debug/config`
2. **Note the `redirectUri` value shown**
3. **Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**
4. **Open your app settings**
5. **In "Redirect URIs", add exactly**: The URI from step 2
6. **Save changes in Spotify dashboard**
7. **Test the login flow again**

### Viewing Logs

To debug issues:
1. Go to your Vercel project dashboard
2. Click on "Functions" tab
3. Click on a specific function execution to see logs
4. Look for error messages during runtime

### Custom Domains

If you want to use a custom domain:
1. Go to your Vercel project settings
2. Add your custom domain under "Domains"
3. Update your `REDIRECT_URI` environment variable to use the custom domain
4. Update the redirect URI in your Spotify app settings accordingly

## Updates and Maintenance

### Updating the App

1. Make changes to your forked repository
2. Push changes to GitHub
3. Vercel will automatically deploy the updates

### Monitoring

- Monitor your app through Vercel dashboard
- Check function logs regularly for any errors
- Vercel provides analytics and performance monitoring

## Security Notes

- Never commit `.env` files to your repository
- Keep your Spotify Client Secret secure in Vercel environment variables
- The app doesn't store user data, but monitor function logs
- Vercel automatically provides HTTPS and security headers

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel's documentation
3. Check Spotify's Web API documentation
4. Open an issue in the GitHub repository