import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve the compiled tracker script
const TRACKER_DIST_PATH = path.join(__dirname, '../../../tracker/dist');

router.get('/tracker/v1/:app/tracker.js', (req: Request, res: Response) => {
  try {
    const trackerPath = path.join(TRACKER_DIST_PATH, 'tracker.js');
    
    if (!fs.existsSync(trackerPath)) {
      return res.status(404).json({ error: 'Tracker script not found. Please build the tracker first.' });
    }

    const script = fs.readFileSync(trackerPath, 'utf8');

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(script);
  } catch (error: any) {
    console.error('Error serving tracker script:', error);
    res.status(500).json({ error: 'Failed to serve tracker script' });
  }
});

// Serve source map if available
router.get('/tracker/v1/:app/tracker.js.map', (req: Request, res: Response) => {
  try {
    const mapPath = path.join(TRACKER_DIST_PATH, 'tracker.js.map');
    
    if (!fs.existsSync(mapPath)) {
      return res.status(404).json({ error: 'Source map not found' });
    }

    const map = fs.readFileSync(mapPath, 'utf8');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(map);
  } catch (error: any) {
    console.error('Error serving source map:', error);
    res.status(500).json({ error: 'Failed to serve source map' });
  }
});

export default router;

