import { TrackingEvent, BatchPayload } from './types';

const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 3;

export class Transport {
  private apiUrl: string;
  private batch: TrackingEvent[] = [];
  private batchTimer: number | null = null;
  private retryQueue: BatchPayload[] = [];

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  send(event: TrackingEvent, sessionId: string): void {
    this.batch.push(event);

    if (this.batch.length >= BATCH_SIZE) {
      this.flush(sessionId);
    } else if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.flush(sessionId);
      }, BATCH_TIMEOUT);
    }
  }

  flush(sessionId: string): void {
    if (this.batch.length === 0) return;

    const payload: BatchPayload = {
      sessionId,
      events: [...this.batch],
    };

    this.batch = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.sendBatch(payload, 0);
  }

  private async sendBatch(payload: BatchPayload, retryCount: number): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process retry queue if any
      if (this.retryQueue.length > 0) {
        const next = this.retryQueue.shift();
        if (next) {
          this.sendBatch(next, 0);
        }
      }
    } catch (error) {
      console.warn('Failed to send tracking batch:', error);
      
      if (retryCount < MAX_RETRIES) {
        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          this.sendBatch(payload, retryCount + 1);
        }, delay);
      } else {
        // Add to retry queue for later
        this.retryQueue.push(payload);
      }
    }
  }

  forceFlush(sessionId: string): void {
    this.flush(sessionId);
  }
}

