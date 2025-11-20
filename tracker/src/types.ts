export interface ClickEvent {
  type: 'click';
  timestamp: number;
  element: {
    tag: string;
    id: string | null;
    classes: string[];
    text: string;
    selector: string;
  };
  pageUrl: string;
}

export interface ScrollEvent {
  type: 'scroll';
  timestamp: number;
  depth: number; // 0-100
  direction: 'up' | 'down';
  pageUrl: string;
}

export interface MutationEvent {
  type: 'mutation';
  timestamp: number;
  mutations: Array<{
    type: 'added' | 'removed';
    selector: string;
    element: {
      tag: string;
      id: string | null;
      classes: string[];
    };
  }>;
  pageUrl: string;
}

export interface SnapshotEvent {
  type: 'snapshot';
  timestamp: number;
  dom: string;
  viewport: {
    width: number;
    height: number;
  };
  device: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    timezone: string;
  };
  pageUrl: string;
}

export type TrackingEvent = ClickEvent | ScrollEvent | MutationEvent | SnapshotEvent;

export interface SessionInfo {
  sessionId: string;
  startTime: number;
  userAgent: string;
  screenSize: {
    width: number;
    height: number;
  };
  timezone: string;
}

export interface BatchPayload {
  sessionId: string;
  events: TrackingEvent[];
}

