# API Documentation

## Base URL

Development: `http://localhost:3001`  
Production: Configure via `API_URL` environment variable

## Authentication

Currently, no authentication is required. In production, implement API keys or OAuth.

## Endpoints

### Tracking

#### POST /api/track

Submit tracking events from the browser SDK.

**Request:**
```http
POST /api/track
Content-Type: application/json

{
  "sessionId": "string (required)",
  "events": [
    {
      "type": "click|scroll|mutation|snapshot (required)",
      "timestamp": "number (required)",
      "pageUrl": "string (required)",
      // ... event-specific data
    }
  ]
}
```

**Event Types:**

**Click Event:**
```json
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
```

**Scroll Event:**
```json
{
  "type": "scroll",
  "timestamp": 1234567890,
  "depth": 75,
  "direction": "down",
  "pageUrl": "https://example.com/page"
}
```

**Mutation Event:**
```json
{
  "type": "mutation",
  "timestamp": 1234567890,
  "mutations": [
    {
      "type": "added",
      "selector": "div.container",
      "element": {
        "tag": "div",
        "id": null,
        "classes": ["container"]
      }
    }
  ],
  "pageUrl": "https://example.com/page"
}
```

**Snapshot Event:**
```json
{
  "type": "snapshot",
  "timestamp": 1234567890,
  "dom": "<html>...</html>",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "device": {
    "userAgent": "Mozilla/5.0...",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "timezone": "America/New_York"
  },
  "pageUrl": "https://example.com/page"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid payload)
- `500` - Internal Server Error

---

### Sessions

#### GET /api/sessions

Retrieve a list of sessions.

**Query Parameters:**
- `limit` (integer, optional): Maximum number of sessions to return. Default: 50, Max: 1000
- `offset` (integer, optional): Number of sessions to skip. Default: 0

**Request:**
```http
GET /api/sessions?limit=50&offset=0
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "string",
      "startTime": "ISO 8601 date string",
      "endTime": "ISO 8601 date string | null",
      "eventCount": 150,
      "userAgent": "string",
      "deviceInfo": {
        "screenWidth": 1920,
        "screenHeight": 1080,
        "timezone": "string"
      },
      "screenResolution": "1920x1080",
      "createdAt": "ISO 8601 date string"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal Server Error

---

#### GET /api/sessions/:sessionId

Get detailed information about a specific session, including all events.

**Path Parameters:**
- `sessionId` (string, required): The session ID

**Request:**
```http
GET /api/sessions/1234567890-abc123
```

**Response:**
```json
{
  "session": {
    "id": "string",
    "startTime": "ISO 8601 date string",
    "endTime": "ISO 8601 date string | null",
    "eventCount": 150,
    "userAgent": "string",
    "deviceInfo": {
      "screenWidth": 1920,
      "screenHeight": 1080,
      "timezone": "string"
    },
    "screenResolution": "1920x1080",
    "createdAt": "ISO 8601 date string"
  },
  "events": [
    {
      "id": "MongoDB ObjectId",
      "eventType": "click|scroll|mutation|snapshot",
      "timestamp": 1234567890,
      "data": {
        // Event-specific data (see event types above)
      },
      "pageUrl": "string",
      "createdAt": "ISO 8601 date string"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found
- `500` - Internal Server Error

---

#### GET /api/sessions/:sessionId/replay

Get replay data formatted for the replay player.

**Path Parameters:**
- `sessionId` (string, required): The session ID

**Request:**
```http
GET /api/sessions/1234567890-abc123/replay
```

**Response:**
```json
{
  "session": {
    "id": "string",
    "startTime": "ISO 8601 date string",
    "deviceInfo": {
      "screenWidth": 1920,
      "screenHeight": 1080,
      "timezone": "string"
    },
    "screenResolution": "1920x1080"
  },
  "events": [
    {
      "type": "click|scroll|mutation|snapshot",
      "timestamp": 1234567890,
      "data": {
        // Event-specific data
      },
      "pageUrl": "string"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `404` - Session not found
- `500` - Internal Server Error

---

### Tracker Script

#### GET /tracker/v1/:app/tracker.js

Serves the compiled and minified tracking script.

**Path Parameters:**
- `app` (string, optional): Application identifier (for multi-tenant support)

**Request:**
```http
GET /tracker/v1/my-app/tracker.js
```

**Response:**
- Content-Type: `application/javascript`
- Cache-Control: `public, max-age=3600`
- CORS headers included

**Status Codes:**
- `200` - Success
- `404` - Tracker script not found (build required)

---

#### GET /tracker/v1/:app/tracker.js.map

Serves the source map for debugging.

**Response:**
- Content-Type: `application/json`
- Cache-Control: `public, max-age=3600`

---

### Health Check

#### GET /health

Check server health status.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 1000 per IP address
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

**Rate Limit Exceeded Response:**
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

Status Code: `429 Too Many Requests`

---

## CORS

CORS is configured for allowed origins. In development, all origins are allowed. In production, configure via `ALLOWED_ORIGINS` environment variable.

**Headers:**
- `Access-Control-Allow-Origin`: Allowed origin
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Allow-Methods`: GET, POST, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "success": false  // for /api/track endpoint
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Examples

### JavaScript Fetch Example

```javascript
// Submit events
const response = await fetch('http://localhost:3001/api/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: '1234567890-abc123',
    events: [
      {
        type: 'click',
        timestamp: Date.now(),
        element: {
          tag: 'button',
          id: 'submit',
          classes: ['btn'],
          text: 'Submit',
          selector: 'button#submit.btn'
        },
        pageUrl: window.location.href
      }
    ]
  })
});

const data = await response.json();
```

### cURL Example

```bash
# Get sessions
curl http://localhost:3001/api/sessions?limit=10

# Get session details
curl http://localhost:3001/api/sessions/1234567890-abc123

# Get replay data
curl http://localhost:3001/api/sessions/1234567890-abc123/replay
```

