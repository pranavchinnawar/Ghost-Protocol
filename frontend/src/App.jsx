import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import TopicSelection from './pages/TopicSelection';
import ChatRoom from './pages/ChatRoom';
import { socket } from './socket';

function generateUsername() {
  return `Ghost_${Math.floor(1000 + Math.random() * 9000)}`;
}

function App() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('ghost_username') || generateUsername();
    setUsername(stored);
    localStorage.setItem('ghost_username', stored);
    socket.connect();
    return () => { socket.disconnect(); };
  }, []);

  const changeUsername = useCallback((newName) => {
    const trimmed = newName.trim().slice(0, 24);
    if (!trimmed || trimmed === username) return;
    const sanitized = trimmed.replace(/[^a-zA-Z0-9_\-]/g, '');
    const final = sanitized || generateUsername();
    setUsername(final);
    localStorage.setItem('ghost_username', final);
  }, [username]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/"          element={<LandingPage username={username} onChangeUsername={changeUsername} />} />
          <Route path="/topics"    element={<TopicSelection username={username} />} />
          <Route path="/chat/:roomId" element={<ChatRoom username={username} onChangeUsername={changeUsername} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
