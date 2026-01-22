# Deployment Guide

This project is a standard **Vite + Vue 3** application, which makes it very easy to deploy to static hosting services like Vercel, Netlify, or GitHub Pages.

## Prerequisites

1.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
2.  **Gemini API Key**: You will need your Google Gemini API Key.

## Option 1: Deploy to Vercel (Recommended)

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  Vercel will auto-detect "Vite" framework settings:
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add key: `VITE_GEMINI_API_KEY`
    *   Value: `your_actual_api_key_here`
6.  Click **Deploy**.

## Option 2: Deploy to Netlify

1.  Log in to [Netlify](https://www.netlify.com/).
2.  Click **"Add new site"** -> **"Import an existing project"**.
3.  Connect to GitHub and select your repo.
4.  Build settings:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
5.  **Environment Variables**:
    *   Click "Show advanced" or go to "Site settings" -> "Environment variables" after creation.
    *   Add `VITE_GEMINI_API_KEY` with your key.
6.  Click **Deploy site**.

## Verification

After deployment, check the live URL.
1.  Open the console (F12) to ensure no errors.
2.  Try to play a move.
3.  If the AI doesn't respond, check if the API Key environment variable was set correctly.
