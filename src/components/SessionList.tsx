import React, { useState, useEffect } from 'react';
import './SessionList.css';

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  eventCount: number;
  userAgent: string;
  deviceInfo: {
    screenWidth: number;
    screenHeight: number;
    timezone: string;
  };
  screenResolution: string;
  createdAt: string;
}

interface SessionListProps {
  onSelectSession: (sessionId: string) => void;
  apiUrl?: string;
}

const SessionList: React.FC<SessionListProps> = ({ onSelectSession, apiUrl = 'http://localhost:3001' }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/sessions?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Ongoing';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const seconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.userAgent.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter.start && new Date(session.startTime) < new Date(dateFilter.start)) return false;
    if (dateFilter.end && new Date(session.startTime) > new Date(dateFilter.end)) return false;
    
    return matchesSearch;
  });

  if (loading) {
    return <div className="session-list-loading">Loading sessions...</div>;
  }

  if (error) {
    return <div className="session-list-error">Error: {error}</div>;
  }

  return (
    <div className="session-list">
      <div className="session-list-header">
        <h2>Session List</h2>
        <button onClick={fetchSessions} className="refresh-btn">Refresh</button>
      </div>

      <div className="session-list-filters">
        <input
          type="text"
          placeholder="Search by Session ID or User Agent..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="date-filters">
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
            placeholder="End Date"
          />
        </div>
      </div>

      <div className="session-list-table">
        <table>
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Events</th>
              <th>Device</th>
              <th>Resolution</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-sessions">No sessions found</td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td className="session-id">
                    <span title={session.id}>
                      {session.id.length > 20 ? `${session.id.substring(0, 20)}…` : session.id}
                    </span>
                    <button
                      className="copy-btn"
                      onClick={() => navigator.clipboard.writeText(session.id)}
                      title="Copy session ID"
                    >
                      Copy
                    </button>
                  </td>
                  <td>{formatDate(session.startTime)}</td>
                  <td>{formatDuration(session.startTime, session.endTime)}</td>
                  <td>{session.eventCount}</td>
                  <td className="device-info">
                    {session.userAgent.includes('Chrome') ? 'Chrome' :
                     session.userAgent.includes('Firefox') ? 'Firefox' :
                     session.userAgent.includes('Safari') ? 'Safari' : 'Other'}
                  </td>
                  <td>{session.screenResolution}</td>
                  <td>
                    <button
                      onClick={() => onSelectSession(session.id)}
                      className="view-btn"
                    >
                      View Replay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SessionList;

