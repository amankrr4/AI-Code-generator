# 🚀 Deployment Guide

This guide will walk you through deploying your AI Code Assistant to Railway (backend) and Vercel (frontend) completely free.

## 📋 Prerequisites

- GitHub account
- Railway account (free tier)
- Vercel account (free tier)
- API keys for AI models (optional - users can input their own)

## 🎯 Step-by-Step Deployment

### 1. Backend Deployment (Railway)

#### Step 1.1: Prepare Repository
1. Push your code to GitHub
2. Ensure the `backend` folder contains:
   - `server.js`
   - `package.json`
   - `railway.json`
   - `nixpacks.toml`
   - `env.example`

#### Step 1.2: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. **Important**: Set the root directory to `backend`
7. Click "Deploy"

#### Step 1.3: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-name.vercel.app
```

Optional (for default API keys):
```env
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
GEMINI_API_KEY=your_gemini_key
```

#### Step 1.4: Get Backend URL
1. Railway will provide a URL like: `https://your-app-name.railway.app`
2. Copy this URL - you'll need it for the frontend

### 2. Frontend Deployment (Vercel)

#### Step 2.1: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. **Important**: Set the root directory to `my-react-app`
6. Click "Deploy"

#### Step 2.2: Configure Environment Variables
In Vercel dashboard, go to Settings > Environment Variables and add:

```env
VITE_API_URL=https://your-backend-name.railway.app
```

#### Step 2.3: Update Frontend URL in Railway
Go back to Railway and update the `FRONTEND_URL` variable with your Vercel URL:
```env
FRONTEND_URL=https://your-frontend-name.vercel.app
```

### 3. Testing Your Deployment

1. **Test Backend**: Visit `https://your-backend.railway.app/health`
   - Should return: `{"status":"Backend is running"}`

2. **Test Frontend**: Visit your Vercel URL
   - Should load the chat interface
   - Try selecting a model and sending a message

3. **Test Integration**: 
   - Select a model (GPT, Claude, or Gemini)
   - Enter an API key
   - Send a test message like "Write a hello world in Python"

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- **Solution**: Check Railway logs for errors
- **Common Issue**: Missing environment variables

**Problem**: CORS errors
- **Solution**: Ensure `FRONTEND_URL` is set correctly in Railway

**Problem**: API calls failing
- **Solution**: Check if API keys are set or users are providing them

### Frontend Issues

**Problem**: Cannot connect to backend
- **Solution**: Check `VITE_API_URL` is set correctly in Vercel

**Problem**: Build fails
- **Solution**: Check if all dependencies are in package.json

### Integration Issues

**Problem**: Messages not sending
- **Solution**: Check browser console for errors
- **Common Issue**: Backend URL mismatch

## 💡 Pro Tips

1. **Custom Domains**: Both Railway and Vercel support custom domains on paid plans
2. **Monitoring**: Use Railway and Vercel dashboards to monitor your apps
3. **Logs**: Check logs in both platforms for debugging
4. **Environment Variables**: Always use environment variables for sensitive data
5. **API Limits**: Be aware of API rate limits for free tiers

## 🔄 Updates and Maintenance

### Updating Your App
1. Push changes to GitHub
2. Railway and Vercel will automatically redeploy
3. Test the updates in production

### Monitoring
- Railway: Check the dashboard for uptime and logs
- Vercel: Monitor build status and performance
- Set up alerts for downtime (paid features)

## 🆓 Free Tier Limits

### Railway
- 500 hours of usage per month
- 1GB RAM
- 1GB storage
- Custom domains (paid)

### Vercel
- Unlimited static deployments
- 100GB bandwidth
- Custom domains (paid)
- Function execution time limits

## 🎉 You're Done!

Your AI Code Assistant is now live and accessible to anyone on the internet! 

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`

Remember to update your CV/portfolio with these live URLs!

