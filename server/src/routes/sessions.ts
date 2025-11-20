import { Router, Request, Response } from 'express';
import { Session } from '../models/Session';
import { Event } from '../models/Event';

const router = Router();

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await Session.countDocuments();

    res.json({
      sessions: sessions.map(s => ({
        id: s.sessionId,
        startTime: s.startTime,
        endTime: s.endTime,
        eventCount: s.eventCount,
        userAgent: s.userAgent,
        deviceInfo: s.deviceInfo,
        screenResolution: s.screenResolution,
        createdAt: s.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({
      session: {
        id: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        eventCount: session.eventCount,
        userAgent: session.userAgent,
        deviceInfo: session.deviceInfo,
        screenResolution: session.screenResolution,
        createdAt: session.createdAt,
      },
      events: events.map(e => ({
        id: e._id,
        eventType: e.eventType,
        timestamp: e.timestamp,
        data: e.data,
        pageUrl: e.pageUrl,
        createdAt: e.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/sessions/:sessionId/replay', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const events = await Event.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    // Format for replay
    const replayData = {
      session: {
        id: session.sessionId,
        startTime: session.startTime,
        deviceInfo: session.deviceInfo,
        screenResolution: session.screenResolution,
      },
      events: events.map(e => ({
        type: e.eventType,
        timestamp: e.timestamp,
        data: e.data,
        pageUrl: e.pageUrl,
      })),
    };

    res.json(replayData);
  } catch (error: any) {
    console.error('Error fetching replay data:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;

