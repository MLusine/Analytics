import { Router, Request, Response } from 'express';
import { Session } from '../models/Session';
import { Event } from '../models/Event';

const router = Router();

interface BatchPayload {
  sessionId: string;
  events: Array<{
    type: string;
    timestamp: number;
    [key: string]: any;
  }>;
}

router.post('/track', async (req: Request, res: Response) => {
  try {
    const payload: BatchPayload = req.body;

    // Validation
    if (!payload.sessionId || !Array.isArray(payload.events)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payload. Expected { sessionId, events[] }' 
      });
    }

    // Find or create session
    let session = await Session.findOne({ sessionId: payload.sessionId });
    
    if (!session) {
      // Extract device info from first snapshot event
      const snapshotEvent = payload.events.find(e => e.type === 'snapshot');
      const deviceInfo = snapshotEvent?.device || {
        screenWidth: 0,
        screenHeight: 0,
        timezone: 'UTC',
      };

      session = new Session({
        sessionId: payload.sessionId,
        startTime: new Date(payload.events[0]?.timestamp || Date.now()),
        eventCount: 0,
        userAgent: snapshotEvent?.device?.userAgent || req.headers['user-agent'] || 'Unknown',
        deviceInfo: {
          screenWidth: deviceInfo.screenWidth || 0,
          screenHeight: deviceInfo.screenHeight || 0,
          timezone: deviceInfo.timezone || 'UTC',
        },
        screenResolution: `${deviceInfo.screenWidth || 0}x${deviceInfo.screenHeight || 0}`,
      });
    }

    // Save events
    const eventsToSave = payload.events.map(event => ({
      sessionId: payload.sessionId,
      eventType: event.type,
      timestamp: event.timestamp,
      data: event,
      pageUrl: event.pageUrl || req.headers.referer || 'unknown',
    }));

    await Event.insertMany(eventsToSave);

    // Update session
    session.eventCount += payload.events.length;
    session.endTime = new Date(Math.max(
      ...payload.events.map(e => e.timestamp),
      session.endTime?.getTime() || 0
    ));
    await session.save();

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking events:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;

