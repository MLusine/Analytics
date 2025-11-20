import { SessionInfo } from './types';

const SESSION_KEY = 'analytics_session';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class SessionManager {
  private sessionInfo: SessionInfo | null = null;

  getSessionId(): string {
    const stored = this.getStoredSession();
    
    if (stored && !this.isSessionExpired(stored)) {
      this.sessionInfo = stored;
      return stored.sessionId;
    }

    // Create new session
    const newSession: SessionInfo = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.saveSession(newSession);
    this.sessionInfo = newSession;
    return newSession.sessionId;
  }

  getSessionInfo(): SessionInfo {
    if (!this.sessionInfo) {
      this.getSessionId();
    }
    return this.sessionInfo!;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStoredSession(): SessionInfo | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private saveSession(session: SessionInfo): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to save session to localStorage', e);
    }
  }

  private isSessionExpired(session: SessionInfo): boolean {
    const now = Date.now();
    const lastActivity = session.startTime;
    return (now - lastActivity) > SESSION_TIMEOUT;
  }

  updateActivity(): void {
    if (this.sessionInfo) {
      this.sessionInfo.startTime = Date.now();
      this.saveSession(this.sessionInfo);
    }
  }
}

