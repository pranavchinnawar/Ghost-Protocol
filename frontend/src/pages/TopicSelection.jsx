import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { Radio } from 'lucide-react';
import Header from '../components/Header';
import CallOverlay from '../components/CallOverlay';

const TOPICS = [
  {
    id: 'Study',
    name: 'Study Session',
    emoji: '📚',
    desc: 'Productivity, focus, homework help — no distractions.',
  },
  {
    id: 'Stress',
    name: 'Vent & Stress',
    emoji: '😮‍💨',
    desc: 'Anonymous space to unload. No judgment, no memory.',
  },
  {
    id: 'Fun',
    name: 'Just Fun',
    emoji: '🎉',
    desc: 'Random chat, memes, and good vibes only.',
  },
];

export default function TopicSelection({ username, onChangeUsername }) {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [matchData, setMatchData] = useState(null);

  useEffect(() => {
    socket.on('match_found', (data) => {
      setMatchData(data);
      setIsSearching(false);
    });

    return () => {
      socket.off('match_found');
    };
  }, []);

  const startMatchmaking = () => {
    setIsSearching(true);
    socket.emit('join_matchmaking', { username });
  };

  const cancelMatchmaking = () => {
    setIsSearching(false);
    socket.emit('leave_matchmaking');
  };

  return (
    <div className="page">
      <Header username={username} onChangeUsername={onChangeUsername} />
      <div className="topics-page-content">
        <h2>Choose a Channel</h2>
        <p className="subtitle" style={{ marginBottom: '3rem' }}>
          Each session lasts 15 minutes. Then everything vanishes.
        </p>

        <div className="topics-grid">
          {TOPICS.map(t => (
            <div
              key={t.id}
              className="topic-card"
              onClick={() => navigate(`/chat/${t.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/chat/${t.id}`)}
            >
              <div className="topic-icon">{t.emoji}</div>
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="call-section">
          {!isSearching && !matchData && (
            <button className="btn-secondary" onClick={startMatchmaking}>
              <Radio size={18} /> Find Anonymous Frequency
            </button>
          )}

          {isSearching && (
            <div className="matchmaking-card">
              <div className="matchmaking-status">
                <div className="loader-freq">
                  <div className="loader-bar" />
                  <div className="loader-bar" />
                  <div className="loader-bar" />
                </div>
                Scanning Frequencies...
              </div>
              <p className="subtitle">Looking for another ghost to connect...</p>
              <button 
                className="btn-danger" 
                onClick={cancelMatchmaking}
                style={{ marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              >
                Abort Search
              </button>
            </div>
          )}
        </div>

        {matchData && (
          <CallOverlay 
            {...matchData}
            onEnd={() => setMatchData(null)}
          />
        )}

        <button
          className="btn-danger"
          style={{ marginTop: '3.5rem' }}
          onClick={() => navigate('/')}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
