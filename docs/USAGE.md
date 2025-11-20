# Usage Examples

## Quick Start

### 1. Basic Integration

Add the tracking script to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to My Website</h1>
  <button id="cta-button">Click Me</button>
  
  <!-- Tracking Script -->
  <script 
    src="http://localhost:3001/tracker/v1/my-app/tracker.js"
    data-api-url="http://localhost:3001">
  </script>
</body>
</html>
```

The tracker automatically initializes when the script loads.

### 2. Manual Initialization

For more control, initialize manually:

```html
<script src="http://localhost:3001/tracker/v1/my-app/tracker.js"></script>
<script>
  const tracker = new Tracker({
    apiUrl: 'http://localhost:3001',
    app: 'my-app' // optional
  });
  
  tracker.init();
  
  // Get current session ID
  const sessionId = tracker.getSessionId();
  console.log('Session ID:', sessionId);
</script>
```

### 3. Stop Tracking

To stop tracking (e.g., for privacy):

```javascript
tracker.stop();
```

## Advanced Usage

### Custom Event Tracking

The tracker automatically captures:
- Clicks
- Scrolls
- DOM mutations
- Initial DOM snapshot

All events are automatically batched and sent to the server.

### Session Management

Sessions are automatically managed:
- Unique session ID generated on first load
- Stored in localStorage
- 30-minute timeout on inactivity
- Session info includes: user agent, screen size, timezone

### Event Batching

Events are automatically batched:
- **Batch size:** 10 events OR
- **Time window:** 5 seconds
- Whichever comes first

Events are sent via POST to `/api/track`.

### Retry Logic

Failed requests are automatically retried:
- Maximum 3 attempts
- Exponential backoff (1s, 2s, 4s)
- Failed batches are queued for later retry

## Integration Examples

### React Application

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load tracker script
    const script = document.createElement('script');
    script.src = 'http://localhost:3001/tracker/v1/my-app/tracker.js';
    script.setAttribute('data-api-url', 'http://localhost:3001');
    document.body.appendChild(script);
    
    return () => {
      // Cleanup if needed
      document.body.removeChild(script);
    };
  }, []);
  
  return <div>My App</div>;
}
```

### Next.js Application

Create `pages/_app.js` or `pages/_app.tsx`:

```tsx
import { useEffect } from 'react';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Load tracker
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_TRACKER_URL || 
                 'http://localhost:3001/tracker/v1/my-app/tracker.js';
    script.setAttribute('data-api-url', 
                       process.env.NEXT_PUBLIC_API_URL || 
                       'http://localhost:3001');
    document.body.appendChild(script);
  }, []);
  
  return <Component {...pageProps} />;
}
```

### Vue.js Application

In `main.js` or `main.ts`:

```javascript
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

// Load tracker
const script = document.createElement('script');
script.src = 'http://localhost:3001/tracker/v1/my-app/tracker.js';
script.setAttribute('data-api-url', 'http://localhost:3001');
document.body.appendChild(script);

app.mount('#app');
```

### WordPress

Add to your theme's `footer.php`:

```php
<script 
  src="http://localhost:3001/tracker/v1/my-app/tracker.js"
  data-api-url="http://localhost:3001">
</script>
```

Or use a plugin to add it to all pages.

### Google Tag Manager

1. Create a new Custom HTML tag
2. Add the script:

```html
<script 
  src="http://localhost:3001/tracker/v1/my-app/tracker.js"
  data-api-url="http://localhost:3001">
</script>
```

3. Trigger: All Pages

## Viewing Sessions

### Using the Replay Player UI

1. Start the replay player:
   ```bash
   npm start
   ```

2. Open http://localhost:3000

3. Browse sessions in the list

4. Click "View Replay" to see a session replay

### Programmatic Access

```javascript
// Get all sessions
const response = await fetch('http://localhost:3001/api/sessions?limit=50');
const { sessions } = await response.json();

// Get specific session
const sessionResponse = await fetch(
  `http://localhost:3001/api/sessions/${sessions[0].id}`
);
const { session, events } = await sessionResponse.json();

// Get replay data
const replayResponse = await fetch(
  `http://localhost:3001/api/sessions/${sessions[0].id}/replay`
);
const replayData = await replayResponse.json();
```

## Configuration

### Environment Variables

**Backend Server:**
```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/analytics
NODE_ENV=production
ALLOWED_ORIGINS=https://example.com,https://www.example.com
```

**React App:**
```bash
REACT_APP_API_URL=https://api.example.com
```

### Multi-App Support

The tracker supports multiple apps via the URL path:

```html
<!-- App 1 -->
<script src="http://localhost:3001/tracker/v1/app1/tracker.js"></script>

<!-- App 2 -->
<script src="http://localhost:3001/tracker/v1/app2/tracker.js"></script>
```

## Best Practices

### 1. Load Tracker Asynchronously

```html
<script 
  src="http://localhost:3001/tracker/v1/my-app/tracker.js"
  data-api-url="http://localhost:3001"
  async>
</script>
```

### 2. Use HTTPS in Production

Always use HTTPS for the tracker script and API in production:

```html
<script 
  src="https://api.example.com/tracker/v1/my-app/tracker.js"
  data-api-url="https://api.example.com">
</script>
```

### 3. Respect User Privacy

Consider adding opt-out functionality:

```javascript
// Check if user has opted out
if (localStorage.getItem('analytics-opt-out') === 'true') {
  // Don't initialize tracker
} else {
  tracker.init();
}
```

### 4. Error Handling

The tracker handles errors gracefully, but you can add custom error handling:

```javascript
window.addEventListener('error', (event) => {
  // Log errors if needed
  console.error('Tracker error:', event.error);
});
```

### 5. Performance

The tracker is designed to be lightweight:
- Minified bundle < 50KB
- Events are batched to reduce network requests
- Throttled scroll events (max 1 per 200ms)

## Troubleshooting

### Events Not Sending

1. **Check browser console** for errors
2. **Verify API URL** is correct
3. **Check CORS settings** on server
4. **Verify network requests** in DevTools Network tab

### Sessions Not Appearing

1. **Check MongoDB connection**
2. **Verify server is running**
3. **Check server logs** for errors
4. **Verify API endpoint** URLs

### Replay Not Working

1. **Ensure snapshot events exist** (check session events)
2. **Check browser console** for errors
3. **Verify event data format**
4. **Check iframe rendering** permissions

## Production Deployment

### 1. Build Assets

```bash
# Build tracker
cd tracker
npm run build

# Build React app
npm run build

# Build server
cd server
npm run build
```

### 2. Deploy Backend

Deploy the server to your hosting provider (e.g., Heroku, AWS, DigitalOcean).

### 3. Deploy Frontend

Deploy the React app to a static hosting service (e.g., Netlify, Vercel, AWS S3).

### 4. Update Tracker URLs

Update all tracker script URLs to point to your production API:

```html
<script 
  src="https://api.yourdomain.com/tracker/v1/my-app/tracker.js"
  data-api-url="https://api.yourdomain.com">
</script>
```

### 5. Configure CDN (Optional)

For better performance, serve the tracker script from a CDN:

1. Upload `tracker/dist/tracker.js` to your CDN
2. Update script URLs to point to CDN
3. Configure cache headers appropriately

## Security Considerations

1. **API Authentication**: Implement API keys or OAuth in production
2. **Rate Limiting**: Already implemented (1000 req/15min per IP)
3. **CORS**: Configure allowed origins in production
4. **Data Privacy**: Consider GDPR compliance, data retention policies
5. **HTTPS**: Always use HTTPS in production
6. **Input Validation**: Server validates all incoming data

## Support

For issues or questions:
1. Check the [README.md](../README.md)
2. Review [API Documentation](./API.md)
3. Open an issue on GitHub

