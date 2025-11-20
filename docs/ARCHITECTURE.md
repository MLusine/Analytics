# Architecture Documentation

## System Overview

The Web Analytics and Session Replay system consists of four main components working together to capture, store, and replay user sessions.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Website with Tracking Script                 │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  Tracker SDK                                  │   │  │
│  │  │  - Event Capture                              │   │  │
│  │  │  - Session Management                        │   │  │
│  │  │  - Event Batching                            │   │  │
│  │  │  - Transport Layer                           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP POST /api/track
                        │ (Batched Events)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js API                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ /api/    │  │ /api/    │  │ /tracker/│          │  │
│  │  │ track    │  │ sessions │  │ v1/...  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │       │              │              │                │  │
│  │       │              │              │                │  │
│  │       ▼              ▼              ▼                │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Business Logic & Validation                 │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └───────────────────────┬──────────────────────────────┘  │
└───────────────────────────┼────────────────────────────────┘
                            │
                            │ MongoDB Operations
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │  Sessions        │      │  Events           │          │
│  │  Collection      │◄─────│  Collection       │          │
│  │                  │      │                  │          │
│  │  - sessionId     │      │  - sessionId     │          │
│  │  - startTime     │      │  - eventType     │          │
│  │  - eventCount    │      │  - timestamp     │          │
│  │  - deviceInfo    │      │  - data          │          │
│  └──────────────────┘      └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP GET /api/sessions
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Replay Player UI                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React Application                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ SessionList  │  │ ReplayPlayer │               │  │
│  │  │ Component    │  │ Component    │               │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Event Capture Flow

```
User Interaction
    │
    ▼
Browser Event (click, scroll, etc.)
    │
    ▼
EventTracker captures event
    │
    ▼
Event added to batch queue
    │
    ├─► Batch size reached (10 events)?
    │   └─► Send batch immediately
    │
    └─► Time window reached (5 seconds)?
        └─► Send batch
    │
    ▼
Transport.send() → POST /api/track
    │
    ├─► Success → Continue
    │
    └─► Failure → Retry (max 3 attempts)
        └─► Still fails → Queue for later
```

### 2. Session Replay Flow

```
User opens Replay Player
    │
    ▼
SessionList component loads
    │
    ▼
GET /api/sessions → List of sessions
    │
    ▼
User selects session
    │
    ▼
GET /api/sessions/:id/replay
    │
    ▼
ReplayPlayer component receives data
    │
    ▼
Render DOM snapshots + events
    │
    ▼
User controls playback
    │
    ▼
Update viewport based on current event
```

## Component Details

### 1. Tracking Script (Browser SDK)

**Location:** `tracker/src/`

**Components:**
- **SessionManager** (`session.ts`): Manages session lifecycle
  - Generates unique session IDs
  - Handles session timeout (30 minutes)
  - Stores session in localStorage
  
- **EventTracker** (`events.ts`): Captures user interactions
  - Click events (element details, selector)
  - Scroll events (depth, direction, throttled)
  - DOM mutations (additions, removals)
  - DOM snapshots (initial page state)
  
- **Transport** (`transport.ts`): Handles data transmission
  - Event batching (10 events or 5 seconds)
  - HTTP POST to `/api/track`
  - Retry logic (3 attempts with exponential backoff)
  - Failed request queue

**Build:**
- Webpack bundles to single file
- Terser minification
- Source maps generated
- Target: ES5 for broad compatibility
- Output: `tracker/dist/tracker.js` (< 50KB)

### 2. Backend Server

**Location:** `server/src/`

**Components:**
- **Express App** (`app.ts`): Main server setup
  - CORS configuration
  - Rate limiting (1000 req/15min per IP)
  - Body parsing (10MB limit)
  - Error handling middleware
  - MongoDB connection

- **Routes:**
  - `/api/track` - Receive tracking events
  - `/api/sessions` - List sessions
  - `/api/sessions/:id` - Get session details
  - `/api/sessions/:id/replay` - Get replay data
  - `/tracker/v1/:app/tracker.js` - Serve tracker script
  - `/health` - Health check

- **Models:**
  - `Session` - Session metadata
  - `Event` - Individual events

**Database:**
- MongoDB with Mongoose ODM
- Indexes on `sessionId`, `timestamp`, `startTime`
- Schema validation

### 3. Replay Player UI

**Location:** `src/components/`

**Components:**
- **SessionList** (`SessionList.tsx`): Session browser
  - Table view of sessions
  - Search and filter functionality
  - Date range filtering
  - Click to view replay

- **ReplayPlayer** (`ReplayPlayer.tsx`): Session replay
  - DOM snapshot rendering (iframe)
  - Playback controls (play/pause, seek)
  - Event timeline visualization
  - Event details panel
  - Progress tracking

**State Management:**
- React hooks (useState, useEffect)
- API calls via fetch
- Local component state

## Technology Stack

### Frontend (Tracker)
- TypeScript
- Webpack
- Terser (minification)
- ES5 target

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- express-rate-limit
- cors

### Replay Player
- React 19
- TypeScript
- CSS3
- Fetch API

## Security Considerations

### 1. CORS
- Configured for allowed origins
- Development: all origins allowed
- Production: whitelist specific domains

### 2. Rate Limiting
- 1000 requests per 15 minutes per IP
- Prevents abuse and DoS attacks

### 3. Input Validation
- All incoming data validated
- Type checking on request bodies
- MongoDB schema validation

### 4. Error Handling
- Errors logged but not exposed to clients
- Generic error messages in production
- Detailed errors in development

## Performance Optimizations

### 1. Event Batching
- Reduces network requests
- Batches up to 10 events or 5 seconds
- Automatic flushing on page unload

### 2. Scroll Throttling
- Maximum 1 scroll event per 200ms
- Reduces event volume significantly

### 3. Database Indexes
- Indexed on frequently queried fields
- Fast session lookups
- Efficient event retrieval

### 4. Caching
- Tracker script cached (1 hour)
- CDN-friendly headers
- Source maps cached separately

## Scalability Considerations

### Current Architecture
- Single server instance
- Single MongoDB instance
- Suitable for small to medium traffic

### Future Enhancements
1. **Horizontal Scaling**
   - Load balancer for multiple server instances
   - MongoDB replica set
   - Session affinity for consistency

2. **Caching Layer**
   - Redis for session data
   - CDN for tracker script
   - Query result caching

3. **Message Queue**
   - RabbitMQ/Kafka for event processing
   - Async event ingestion
   - Better handling of traffic spikes

4. **Data Archival**
   - Move old sessions to cold storage
   - Compress historical data
   - Retention policies

## Monitoring and Observability

### Recommended Metrics
- Event ingestion rate
- API response times
- Error rates
- Database query performance
- Session replay success rate

### Logging
- Request/response logging (development)
- Error logging (all environments)
- MongoDB connection status

### Health Checks
- `/health` endpoint
- MongoDB connectivity check
- Disk space monitoring

## Deployment Architecture

### Development
```
Local Machine
├── MongoDB (local or Docker)
├── Backend Server (localhost:3001)
└── React App (localhost:3000)
```

### Production (Recommended)
```
┌─────────────────┐
│   CDN/CloudFlare│  ← Tracker Script
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Load Balancer  │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Server 1│ │Server 2│  ← Backend API
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         ▼
┌─────────────────┐
│  MongoDB        │
│  (Replica Set)  │
└─────────────────┘
```

## Future Enhancements

1. **Real-time Replay**
   - WebSocket connection for live sessions
   - Stream events as they happen

2. **Advanced Analytics**
   - Heatmaps
   - Funnel analysis
   - User journey mapping

3. **Privacy Features**
   - Data masking
   - PII redaction
   - User consent management

4. **Performance Monitoring**
   - Core Web Vitals tracking
   - Resource timing
   - Error tracking

