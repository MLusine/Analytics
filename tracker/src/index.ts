import { SessionManager } from './session';
import { EventTracker } from './events';
import { Transport } from './transport';

export interface TrackerConfig {
  apiUrl: string;
  app?: string;
}

class Tracker {
  private sessionManager: SessionManager;
  private eventTracker: EventTracker;
  private transport: Transport;
  private config: TrackerConfig;
  private initialized: boolean = false;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.sessionManager = new SessionManager();
    this.transport = new Transport(config.apiUrl);
    
    this.eventTracker = new EventTracker((event) => {
      const sessionId = this.sessionManager.getSessionId();
      this.sessionManager.updateActivity();
      this.transport.send(event, sessionId);
    });
  }

  init(): void {
    if (this.initialized) {
      console.warn('Tracker already initialized');
      return;
    }

    // Get or create session
    this.sessionManager.getSessionId();

    // Start tracking events
    this.eventTracker.start();

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.transport.forceFlush(this.sessionManager.getSessionId());
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.transport.forceFlush(this.sessionManager.getSessionId());
      }
    });

    this.initialized = true;
  }

  stop(): void {
    if (!this.initialized) return;
    
    this.eventTracker.stop();
    this.transport.forceFlush(this.sessionManager.getSessionId());
    this.initialized = false;
  }

  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }
}

// Global initialization
declare global {
  interface Window {
    Tracker: typeof Tracker;
    trackerInstance?: Tracker;
  }
}

if (typeof window !== 'undefined') {
  window.Tracker = Tracker;
  
  // Auto-initialize if config is available
  const scriptTag = document.currentScript as HTMLScriptElement;
  if (scriptTag) {
    const dataApiUrl = scriptTag.getAttribute('data-api-url');
    if (dataApiUrl) {
      const tracker = new Tracker({ apiUrl: dataApiUrl });
      tracker.init();
      window.trackerInstance = tracker;
    }
  }
}

export default Tracker;

