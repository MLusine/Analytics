import React, { useState, useEffect, useRef } from 'react';
import './ReplayPlayer.css';

interface ReplayEvent {
  type: string;
  timestamp: number;
  data: any;
  pageUrl: string;
}

interface ReplayData {
  session: {
    id: string;
    startTime: string;
    deviceInfo: {
      screenWidth: number;
      screenHeight: number;
      timezone: string;
    };
    screenResolution: string;
  };
  events: ReplayEvent[];
}

interface ReplayPlayerProps {
  sessionId: string;
  onClose: () => void;
  apiUrl?: string;
}

const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ sessionId, onClose, apiUrl = 'http://localhost:3001' }) => {
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(null);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchReplayData();
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (replayData && replayData.events.length > 0) {
      renderCurrentSnapshot();
    }
  }, [currentEventIndex, replayData]);

  const fetchReplayData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/sessions/${sessionId}/replay`);
      if (!response.ok) throw new Error('Failed to fetch replay data');
      const data = await response.json();
      setReplayData(data);
      setError(null);
      
      if (data.events && data.events.length > 0) {
        const firstTimestamp = data.events[0].timestamp;
        const lastTimestamp = data.events[data.events.length - 1].timestamp;
        setTotalTime((lastTimestamp - firstTimestamp) / 1000);
        setCurrentEventIndex(0);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentSnapshot = () => {
    if (!replayData || !playerRef.current) return;

    // Find the most recent snapshot up to current event
    let snapshotEvent: ReplayEvent | null = null;
    for (let i = currentEventIndex; i >= 0; i--) {
      if (replayData.events[i].type === 'snapshot') {
        snapshotEvent = replayData.events[i];
        break;
      }
    }

    if (!snapshotEvent || !snapshotEvent.data.dom) {
      return;
    }

    // Create or update iframe
    if (!iframeRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.background = 'white';
      playerRef.current.innerHTML = '';
      playerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
    }

    const iframe = iframeRef.current;
    if (iframe.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(snapshotEvent.data.dom);
      iframe.contentDocument.close();
    }
  };

  const handlePlayPause = () => {
    if (!replayData) return;

    if (isPlaying) {
      // Pause
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      setIsPlaying(true);
      const startTime = replayData.events[0].timestamp;
      const playSpeed = 1; // 1x speed

      playIntervalRef.current = window.setInterval(() => {
        setCurrentEventIndex(prev => {
          if (prev >= replayData.events.length - 1) {
            setIsPlaying(false);
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current);
              playIntervalRef.current = null;
            }
            return prev;
          }
          const next = prev + 1;
          const eventTime = (replayData.events[next].timestamp - startTime) / 1000;
          setCurrentTime(eventTime);
          return next;
        });
      }, 1000 / playSpeed);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replayData) return;
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    
    const startTime = replayData.events[0].timestamp;
    const targetTimestamp = startTime + (seekTime * 1000);
    
    // Find closest event
    let closestIndex = 0;
    let closestDiff = Math.abs(replayData.events[0].timestamp - targetTimestamp);
    
    for (let i = 1; i < replayData.events.length; i++) {
      const diff = Math.abs(replayData.events[i].timestamp - targetTimestamp);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    setCurrentEventIndex(closestIndex);
    if (isPlaying) {
      handlePlayPause(); // Pause when seeking
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'click': return '#007bff';
      case 'scroll': return '#28a745';
      case 'mutation': return '#ffc107';
      case 'snapshot': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatEventData = (data: any) => {
    return JSON.stringify(data, null, 2).replace(/\\n/g, '\n');
  };

  const getEventRows = (event: ReplayEvent) => {
    const rows: Array<{ label: string; value: React.ReactNode }> = [
      { label: 'Type', value: event.type },
      { label: 'Timestamp', value: new Date(event.timestamp).toLocaleString() },
      { label: 'Page URL', value: event.pageUrl },
    ];

    if (event.type === 'click' && event.data.element) {
      rows.push(
        { label: 'Element Tag', value: event.data.element.tag },
        { label: 'Element ID', value: event.data.element.id || '—' },
        {
          label: 'Element Classes',
          value: event.data.element.classes?.length
            ? event.data.element.classes.join(', ')
            : '—',
        },
        { label: 'Text Content', value: event.data.element.text || '—' },
        { label: 'Selector', value: event.data.element.selector || '—' }
      );
    }

    if (event.type === 'scroll') {
      rows.push(
        { label: 'Scroll Depth', value: `${event.data.depth}%` },
        { label: 'Direction', value: event.data.direction }
      );
    }

    if (event.type === 'mutation') {
      rows.push({
        label: 'Mutations Count',
        value: event.data.mutations?.length || 0,
      });
    }

    if (event.type === 'snapshot') {
      rows.push(
        {
          label: 'Viewport',
          value: event.data.viewport
            ? `${event.data.viewport.width} x ${event.data.viewport.height}`
            : '—',
        },
        {
          label: 'Device',
          value: event.data.device
            ? `${event.data.device.screenWidth} x ${event.data.device.screenHeight} (${event.data.device.timezone})`
            : '—',
        }
      );
    }

    return rows;
  };

  const handleTimelineClick = (event: ReplayEvent, index: number) => {
    setCurrentEventIndex(index);
    setSelectedEvent(event);
    const startTime = replayData?.events[0].timestamp || 0;
    setCurrentTime((event.timestamp - startTime) / 1000);
    if (isPlaying) {
      handlePlayPause();
    }
  };

  if (loading) {
    return (
      <div className="replay-player-container">
        <div className="replay-loading">Loading replay data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="replay-player-container">
        <div className="replay-error">Error: {error}</div>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    );
  }

  if (!replayData) {
    return (
      <div className="replay-player-container">
        <div className="replay-error">No replay data available</div>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    );
  }

  return (
    <div className="replay-player-container">
      <div className="replay-header">
        <div className="replay-info">
          <h3>Session Replay: {sessionId.substring(0, 20)}...</h3>
          <div className="session-meta">
            <span>Device: {replayData.session.screenResolution}</span>
            <span>Events: {replayData.events.length}</span>
            <span>Started: {new Date(replayData.session.startTime).toLocaleString()}</span>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>

      <div className="replay-content">
        <div className="player-section">
          <div className="player-viewport" ref={playerRef}></div>
          
          <div className="player-controls">
            <button onClick={handlePlayPause} className="play-pause-btn">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="progress-section">
              <input
                type="range"
                min="0"
                max={totalTime}
                value={currentTime}
                onChange={handleSeek}
                className="progress-bar"
              />
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(totalTime)}
              </div>
            </div>
          </div>
        </div>

        <div className="replay-sidebar">
          <div className="event-timeline">
            <h4>Event Timeline</h4>
            <div className="timeline-container">
              {replayData.events.map((event, index) => {
                const startTime = replayData.events[0].timestamp;
                const endTime = replayData.events[replayData.events.length - 1].timestamp;
                const position = ((event.timestamp - startTime) / (endTime - startTime)) * 100;
                return (
                  <div
                    key={index}
                    className={`timeline-marker ${index === currentEventIndex ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: getEventTypeColor(event.type),
                      left: `${position}%`
                    }}
                    onClick={() => handleTimelineClick(event, index)}
                    title={`${event.type} at ${new Date(event.timestamp).toLocaleTimeString()}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="event-details">
            <h4>Event Details</h4>
            {selectedEvent ? (
              <div className="event-details-content">
                <table className="event-details-table">
                  <tbody>
                    {getEventRows(selectedEvent).map((row, index) => (
                      <tr key={`${row.label}-${index}`}>
                        <th>{row.label}</th>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                    <tr>
                      <th>Full Data</th>
                      <td>
                        <pre className="event-json">
                          {formatEventData(selectedEvent.data)}
                        </pre>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-event-selected">Click on a timeline marker to view event details</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayPlayer;
