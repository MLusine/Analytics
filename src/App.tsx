import React, { useState } from 'react';
import './App.css';
import SessionList from './components/SessionList';
import ReplayPlayer from './components/ReplayPlayer';

function App() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseReplay = () => {
    setSelectedSessionId(null);
  };

  return (
    <div className="App">
      {selectedSessionId ? (
        <ReplayPlayer
          sessionId={selectedSessionId}
          onClose={handleCloseReplay}
          apiUrl={apiUrl}
        />
      ) : (
        <SessionList
          onSelectSession={handleSelectSession}
          apiUrl={apiUrl}
        />
      )}
    </div>
  );
}

export default App;
