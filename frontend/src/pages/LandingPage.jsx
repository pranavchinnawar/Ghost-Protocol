import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Header from '../components/Header';
import ParticleCanvas from '../components/ParticleCanvas';

export default function LandingPage({ username, onChangeUsername }) {
  const navigate = useNavigate();

  return (
    <div className="page">
      <ParticleCanvas />
      <Header username={username} onChangeUsername={onChangeUsername} />
      <div className="landing-content">
        <h1 className="title">Ghost Protocol</h1>
        <p className="subtitle">
          Privacy-first, zero-knowledge, anonymous communication.<br />
          No accounts. No history. No trace.
        </p>

        <div className="identity-card">
          <div className="icon-wrap">
            <ShieldAlert size={44} strokeWidth={1.5} />
          </div>
          <h3>Your Temporary Identity</h3>
          <div className="username">{username || 'Connecting...'}</div>
          <p>
            This identity is randomly generated and stored only in your browser. It disappears when you leave.
          </p>
        </div>

        <button className="btn-primary" onClick={() => navigate('/topics')}>
          Enter the Shadows →
        </button>

        <div className="landing-badges">
          <span>🔒 Zero logs</span>
          <span>👻 Anonymous</span>
          <span>⏱ Auto-deletes</span>
          <span>💾 No database</span>
        </div>
      </div>
    </div>
  );
}
