# Quick Setup Guide

## Prerequisites

- Node.js 16+ and npm
- MongoDB (local installation or MongoDB Atlas account)

## Step-by-Step Setup

### 1. Install MongoDB

**Option A: Local MongoDB**
```bash
# macOS (using Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string

### 2. Clone and Install

```bash
# Install tracker dependencies
cd tracker
npm install

# Install server dependencies
cd ../server
npm install

# Install UI dependencies (from root)
cd ..
npm install
```

### 3. Build Tracker

```bash
cd tracker
npm run build
```

This creates `tracker/dist/tracker.js` which the server will serve.

### 4. Configure Environment

**Server Configuration:**

Create `server/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/analytics
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

Or for MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/analytics?retryWrites=true&w=majority
```

**React App Configuration:**

Create `.env` in the root directory:
```env
REACT_APP_API_URL=http://localhost:3001
```

### 5. Start MongoDB

**If using local MongoDB:**
```bash
# macOS/Linux
mongod

# Windows
# Start MongoDB service from Services panel
```

**If using MongoDB Atlas:**
- No local setup needed, just use the connection string

### 6. Start Services

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on port 3001
Environment: development
```

**Terminal 2 - React UI:**
```bash
# From root directory
npm start
```

The UI will open at http://localhost:3000

### 7. Test the System

1. **Open the demo page:**
   - Open `demo/index.html` in your browser
   - Or serve it: `python -m http.server 8080` (in demo folder)
   - Visit http://localhost:8080

2. **Interact with the demo:**
   - Click buttons
   - Scroll the page
   - Add/remove items
   - All interactions are tracked!

3. **View sessions:**
   - Go to http://localhost:3000
   - You should see your session in the list
   - Click "View Replay" to see the replay

## Troubleshooting

### "Tracker script not found"
- Make sure you built the tracker: `cd tracker && npm run build`

### "MongoDB connection error"
- Check if MongoDB is running: `mongosh` or `mongo`
- Verify connection string in `server/.env`
- For Atlas: Check IP whitelist and credentials

### "CORS error"
- Check `ALLOWED_ORIGINS` in server `.env`
- In development, all origins are allowed by default

### "Events not appearing"
- Check browser console for errors
- Verify API URL is correct
- Check server logs for errors
- Verify MongoDB connection

### Port already in use
- Change `PORT` in `server/.env`
- Update `REACT_APP_API_URL` accordingly

## Production Deployment

### 1. Build Everything

```bash
# Build tracker
cd tracker
npm run build

# Build server
cd ../server
npm run build

# Build React app
cd ..
npm run build
```

### 2. Deploy Backend

Deploy the `server` folder to your hosting provider:
- Heroku
- AWS EC2/Elastic Beanstalk
- DigitalOcean
- Railway
- etc.

Set environment variables on your hosting platform.

### 3. Deploy Frontend

Deploy the `build` folder (from `npm run build`) to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- etc.

### 4. Update Tracker URLs

Update all tracker script URLs to point to your production API:

```html
<script 
  src="https://api.yourdomain.com/tracker/v1/my-app/tracker.js"
  data-api-url="https://api.yourdomain.com">
</script>
```

## Next Steps

- Read the [README.md](./README.md) for detailed documentation
- Check [docs/API.md](./docs/API.md) for API reference
- See [docs/USAGE.md](./docs/USAGE.md) for usage examples
- Review [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system architecture

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs
3. Check browser console
4. Verify all services are running
5. Ensure MongoDB is accessible

