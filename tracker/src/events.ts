import { ClickEvent, ScrollEvent, MutationEvent, SnapshotEvent, TrackingEvent } from './types';

export class EventTracker {
  private mutationObserver: MutationObserver | null = null;
  private scrollThrottleTimer: number | null = null;
  private lastScrollDepth: number = 0;
  private lastScrollTime: number = 0;
  private events: TrackingEvent[] = [];
  private onEventCallback?: (event: TrackingEvent) => void;

  constructor(onEvent?: (event: TrackingEvent) => void) {
    this.onEventCallback = onEvent;
  }

  start(): void {
    this.captureInitialSnapshot();
    this.attachClickListeners();
    this.attachScrollListeners();
    this.attachMutationObserver();
  }

  stop(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    document.removeEventListener('click', this.handleClick);
    window.removeEventListener('scroll', this.handleScroll);
    if (this.scrollThrottleTimer) {
      clearTimeout(this.scrollThrottleTimer);
    }
  }

  private captureInitialSnapshot(): void {
    const snapshot: SnapshotEvent = {
      type: 'snapshot',
      timestamp: Date.now(),
      dom: this.serializeDOM(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      device: {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      pageUrl: window.location.href,
    };
    this.recordEvent(snapshot);
  }

  private serializeDOM(): string {
    return document.documentElement.outerHTML;
  }

  private attachClickListeners(): void {
    document.addEventListener('click', this.handleClick.bind(this), true);
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    const clickEvent: ClickEvent = {
      type: 'click',
      timestamp: Date.now(),
      element: {
        tag: target.tagName.toLowerCase(),
        id: target.id || null,
        classes: Array.from(target.classList || []),
        text: this.getElementText(target),
        selector: this.generateSelector(target),
      },
      pageUrl: window.location.href,
    };

    this.recordEvent(clickEvent);
  }

  private attachScrollListeners(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  private handleScroll(): void {
    const now = Date.now();
    if (now - this.lastScrollTime < 200) {
      return; // Throttle to max 1 event per 200ms
    }

    this.lastScrollTime = now;

    if (this.scrollThrottleTimer) {
      clearTimeout(this.scrollThrottleTimer);
    }

    this.scrollThrottleTimer = window.setTimeout(() => {
      const scrollDepth = this.calculateScrollDepth();
      const direction = scrollDepth > this.lastScrollDepth ? 'down' : 'up';
      this.lastScrollDepth = scrollDepth;

      const scrollEvent: ScrollEvent = {
        type: 'scroll',
        timestamp: Date.now(),
        depth: scrollDepth,
        direction,
        pageUrl: window.location.href,
      };

      this.recordEvent(scrollEvent);
    }, 200);
  }

  private calculateScrollDepth(): number {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollableHeight = documentHeight - windowHeight;
    
    if (scrollableHeight <= 0) return 0;
    
    const depth = Math.round((scrollTop / scrollableHeight) * 100);
    return Math.min(100, Math.max(0, depth));
  }

  private attachMutationObserver(): void {
    if (!window.MutationObserver) return;

    this.mutationObserver = new MutationObserver((mutations) => {
      const mutationEvent: MutationEvent = {
        type: 'mutation',
        timestamp: Date.now(),
        mutations: mutations.map((mutation) => {
          const target = mutation.target as HTMLElement;
          return {
            type: mutation.addedNodes.length > 0 ? 'added' : 'removed',
            selector: this.generateSelector(target),
            element: {
              tag: target.tagName?.toLowerCase() || 'unknown',
              id: target.id || null,
              classes: Array.from(target.classList || []),
            },
          };
        }),
        pageUrl: window.location.href,
      };

      this.recordEvent(mutationEvent);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private recordEvent(event: TrackingEvent): void {
    this.events.push(event);
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }

  getEvents(): TrackingEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }

  private getElementText(element: HTMLElement): string {
    return element.textContent?.trim().substring(0, 100) || '';
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      const siblings = Array.from(current.parentElement?.children || []);
      const index = siblings.indexOf(current);
      if (siblings.length > 1) {
        selector += `:nth-child(${index + 1})`;
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ') || element.tagName.toLowerCase();
  }
}

