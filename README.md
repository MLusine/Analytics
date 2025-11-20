# Web Analytics and Session Replay System

A comprehensive web analytics and session replay system with four main components:

1. **Tracking Script** - Browser SDK that captures user interactions
2. **Storage System** - Backend that receives and stores data
3. **Bundle Delivery** - Script serving infrastructure
4. **Replay Player** - UI to visualize sessions

## Architecture

```
┌─────────────────┐
│  Website        │
│  (with tracker) │
└────────┬────────┘
         │
         │ Events
         ▼
┌─────────────────┐
│  Backend API    │
│  (Express)      │
└────────┬────────┘
         │
         │ Store
         ▼
┌─────────────────┐
│  MongoDB        │
│  (Sessions &    │
│   Events)       │
└─────────────────┘
         │
         │ Query
         ▼
┌─────────────────┐
│  Replay Player  │
│  (React UI)     │
└─────────────────┘
```

## Project Structure

```
analytics/
├── tracker/          # Browser SDK (tracking script)
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   ├── session.ts    # Session management
│   │   ├── events.ts     # Event tracking
│   │   ├── transport.ts  # Data batching & sending
│   │   └── types.ts      # TypeScript types
│   ├── webpack.config.js
│   └── package.json
├── server/          # Backend API
│   ├── src/
│   │   ├── app.ts        # Express server
│   │   ├── models/       # MongoDB models
│   │   └── routes/       # API routes
│   └── package.json
└── src/             # Replay Player UI
    ├── components/
    │   ├── SessionList.tsx
    │   └── ReplayPlayer.tsx
    └── App.tsx
```

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- MongoDB (local or cloud instance)

### 1. Install Dependencies

#### Tracking Script
```bash
cd tracker
npm install
```

#### Backend Server
```bash
cd server
npm install
```

#### Replay Player UI
```bash
# From root directory
npm install
```

### 2. Build Tracking Script

```bash
cd tracker
npm run build
```

This creates `tracker/dist/tracker.js` (minified, < 50KB).

### 3. Configure Environment

Create `.env` files or set environment variables:

**Server (.env or environment variables):**
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/analytics
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

**React App (.env):**
```
REACT_APP_API_URL=http://localhost:3001
```

### 4. Start Services

#### Start MongoDB
```bash
# If using local MongoDB
mongod
```

#### Start Backend Server
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

#### Start Replay Player UI
```bash
# From root directory
npm start
# UI runs on http://localhost:3000
```

## Usage

### Integrating the Tracking Script

Add the tracking script to your website:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Your website content -->
  
  <!-- Tracking Script -->
  <script 
    src="http://localhost:3001/tracker/v1/my-app/tracker.js"
    data-api-url="http://localhost:3001">
  </script>
  <script>
    // Auto-initializes if data-api-url is set
    // Or manually:
    // const tracker = new Tracker({ apiUrl: 'http://localhost:3001' });
    // tracker.init();
  </script>
</body>
</html>
```

### Manual Initialization

```javascript
<script src="http://localhost:3001/tracker/v1/my-app/tracker.js"></script>
<script>
  const tracker = new Tracker({
    apiUrl: 'http://localhost:3001',
    app: 'my-app' // optional
  });
  tracker.init();
</script>
```

## API Documentation

### POST /api/track

Accepts tracking events from the browser SDK.

**Request Body:**
```json
{
  "sessionId": "1234567890-abc123",
  "events": [
    {
      "type": "click",
      "timestamp": 1234567890,
      "element": {
        "tag": "button",
        "id": "submit-btn",
        "classes": ["btn", "primary"],
        "text": "Submit",
        "selector": "button#submit-btn.btn.primary"
      },
      "pageUrl": "https://example.com/page"
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/sessions

Retrieve list of sessions.

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 50)
- `offset` (optional): Number of sessions to skip (default: 0)

**Response:**
```json
{
  "sessions": [
    {
      "id": "1234567890-abc123",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-01T00:30:00.000Z",
      "eventCount": 150,
      "userAgent": "Mozilla/5.0...",
      "deviceInfo": {
        "screenWidth": 1920,
        "screenHeight": 1080,
        "timezone": "America/New_York"
      },
      "screenResolution": "1920x1080",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### GET /api/sessions/:sessionId

Get detailed session information with all events.

**Response:**
```json
{
  "session": {
    "id": "1234567890-abc123",
    "startTime": "2024-01-01T00:00:00.000Z",
    "endTime": "2024-01-01T00:30:00.000Z",
    "eventCount": 150,
    "userAgent": "Mozilla/5.0...",
    "deviceInfo": {...},
    "screenResolution": "1920x1080",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "events": [
    {
      "id": "event-id",
      "eventType": "click",
      "timestamp": 1234567890,
      "data": {...},
      "pageUrl": "https://example.com/page",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/sessions/:sessionId/replay

Get replay data for a session (formatted for player).

**Response:**
```json
{
  "session": {
    "id": "1234567890-abc123",
    "startTime": "2024-01-01T00:00:00.000Z",
    "deviceInfo": {...},
    "screenResolution": "1920x1080"
  },
  "events": [
    {
      "type": "snapshot",
      "timestamp": 1234567890,
      "data": {
        "dom": "<html>...</html>",
        "viewport": {...},
        "device": {...}
      },
      "pageUrl": "https://example.com/page"
    }
  ]
}
```

### GET /tracker/v1/:app/tracker.js

Serves the compiled tracking script.

**Headers:**
- `Content-Type: application/javascript`
- `Cache-Control: public, max-age=3600`
- CORS headers included

## Features

### Tracking Script

- ✅ Click event tracking (element details, selector)
- ✅ Scroll tracking (depth, direction, throttled)
- ✅ DOM mutation tracking (additions, removals)
- ✅ DOM snapshots (initial page state)
- ✅ Session management (30min timeout)
- ✅ Event batching (10 events or 5 seconds)
- ✅ Retry logic (max 3 attempts)
- ✅ Minified bundle (< 50KB)

### Backend

- ✅ RESTful API endpoints
- ✅ MongoDB storage
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Request validation
- ✅ Error handling
- ✅ Environment configuration

### Replay Player

- ✅ Session list with search and filters
- ✅ Playback controls (play/pause, seek)
- ✅ Event timeline visualization
- ✅ Event details panel
- ✅ DOM snapshot rendering
- ✅ Responsive UI

## Database Schema

### Sessions Collection

```javascript
{
  sessionId: String (unique, indexed),
  startTime: Date (indexed),
  endTime: Date,
  eventCount: Number,
  userAgent: String,
  deviceInfo: {
    screenWidth: Number,
    screenHeight: Number,
    timezone: String
  },
  screenResolution: String,
  createdAt: Date
}
```

### Events Collection

```javascript
{
  sessionId: String (indexed),
  eventType: String (enum: 'click', 'scroll', 'mutation', 'snapshot'),
  timestamp: Number (indexed),
  data: Object, // Event-specific data
  pageUrl: String,
  createdAt: Date
}
```

## Development

### Building the Tracker

```bash
cd tracker
npm run build
```

### Running Tests

```bash
# Backend tests (if implemented)
cd server
npm test

# Frontend tests
npm test
```

### Production Build

```bash
# Build tracker
cd tracker
npm run build

# Build React app
npm run build

# Build server (TypeScript)
cd server
npm run build
```

## Troubleshooting

### Tracker not sending events

1. Check browser console for errors
2. Verify `apiUrl` is correct
3. Check CORS settings on server
4. Verify network requests in DevTools

### Sessions not appearing

1. Check MongoDB connection
2. Verify server is running
3. Check server logs for errors
4. Verify API endpoint URLs

### Replay not working

1. Ensure snapshot events exist
2. Check browser console for errors
3. Verify event data format
4. Check iframe rendering permissions

## License

MIT

## Contributing

Contributions welcome! Please open an issue or pull request.
