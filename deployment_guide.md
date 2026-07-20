# 🌐 PotholeAI — Deployment Guide

This guide explains how to deploy the PotholeAI system online (Frontend on **Vercel** and Backend on **Render**) using free-tier cloud hosting.

---

## 🐍 Part 1: Deploying the Flask Backend on Render

[Render](https://render.com/) is a cloud platform that offers a free tier for hosting Python web services.

### Step-by-Step Backend Deploy:
1. **Sign Up / Log In**:
   * Go to [Render](https://render.com/) and click **Sign Up**. Log in using your **GitHub account**.
2. **Create Web Service**:
   * On your Render dashboard, click the **New +** button and select **Web Service**.
   * Select **Build and deploy from a Git repository**.
   * Find and connect your **`pothole-detection`** repository.
3. **Configure Settings**:
   * **Name**: `pothole-backend` (or a name of your choice).
   * **Region**: Select the region closest to you (e.g., Singapore or US East).
   * **Branch**: `main`.
   * **Root Directory**: `backend` *(This is important! Ensure Render points to the backend subfolder).*
   * **Language**: `Python`.
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn app:app` *(Render will run Flask using gunicorn production server).*
4. **Configure Environment Variables**:
   * Scroll down and click **Advanced**.
   * Click **Add Environment Variable** and add:
     * **Key**: `GEMINI_API_KEY`
     * **Value**: *[Paste your real Google Gemini API Key here]*
5. **Deploy**:
   * Click **Create Web Service**.
   * Render will build and deploy the backend. Once active, copy the **live URL** (e.g., `https://pothole-backend-xxxx.onrender.com`).

---

## ⚛️ Part 2: Deploying the React Frontend on Vercel

[Vercel](https://vercel.com/) is the premium hosting choice for React frontends.

### Step-by-Step Frontend Deploy:
1. **Sign Up / Log In**:
   * Go to [Vercel](https://vercel.com/) and log in using your **GitHub account**.
2. **Import Project**:
   * On your Vercel dashboard, click **Add New** and select **Project**.
   * Find your **`pothole-detection`** repository and click **Import**.
3. **Configure Settings**:
   * **Framework Preset**: `Create React App` (Vercel auto-detects this).
   * **Root Directory**: Click *Edit* and select the **`frontend`** directory.
4. **Configure Environment Variables**:
   * Expand the **Environment Variables** section.
   * Add the backend link variable:
     * **Name**: `REACT_APP_API_URL`
     * **Value**: *[Paste the Render live URL you copied in Part 1 (e.g., `https://pothole-backend-xxxx.onrender.com`)]*
5. **Deploy**:
   * Click **Deploy**.
   * Vercel will bundle the React code and give you a live URL (e.g., `https://pothole-detection-xxx.vercel.app`).

---

## ⚙️ Part 3: Updating CORS (If Needed)
To allow your Vercel frontend to talk securely to your Render backend, make sure to add your Vercel URL to the CORS policy in the backend.
* In [app.py](file:///c:/Users/gurle/OneDrive/Apps/pothole-app/backend/app.py):
  ```python
  CORS(app, origins=["http://localhost:3000", "https://your-vercel-app-url.vercel.app"])
  ```
  *(You can also use `CORS(app)` during testing to allow requests from any origin).*
