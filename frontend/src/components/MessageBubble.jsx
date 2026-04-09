import { useState } from 'react';
import { Mic } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '🔥'];

export default function MessageBubble({ msg, currentUsername, onReact, reactions = {} }) {
  const [showPicker, setShowPicker] = useState(false);

  if (msg.isSystem) {
    return (
      <div className="message-row system">
        <div className="message-system">{msg.text}</div>
      </div>
    );
  }

  const isSentByMe = msg.username === currentUsername;

  const handleReact = (emoji) => {
    onReact(msg.id, emoji);
    setShowPicker(false);
  };

  // Build reaction chips: { emoji: count, mine: bool }
  const reactionChips = Object.entries(reactions).map(([emoji, users]) => ({
    emoji,
    count: users.length,
    mine: users.includes(currentUsername),
  }));

  return (
    <div
      className={`message-row ${isSentByMe ? 'sent' : 'received'}`}
      onMouseEnter={() => setShowPicker(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: isSentByMe ? 'flex-end' : 'flex-start' }}>
        <div
          className="message-bubble"
          onDoubleClick={() => setShowPicker(p => !p)}
          title="Double-click to react"
          style={{ cursor: 'pointer' }}
        >
          {!isSentByMe && <div className="message-sender">{msg.username}</div>}
          
          {msg.type === 'image' && (
            <img 
              src={msg.content} 
              alt="shared" 
              className="message-image" 
              onClick={() => window.open(msg.content, '_blank')}
            />
          )}
          
          {msg.type === 'audio' && (
            <div className="audio-note-container">
              <div className="audio-note-header">
                <Mic size={14} className="audio-mic-icon" />
                <span>Voice Ghost Note</span>
              </div>
              <audio controls src={msg.content} className="message-audio" />
            </div>
          )}

          {(!msg.type || msg.type === 'text') && <div className="message-text">{msg.text}</div>}
          <div className="message-time">{msg.time}</div>

          {/* Reaction Picker */}
          {showPicker && (
            <div className="reaction-picker">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => handleReact(e)} title={e}>{e}</button>
              ))}
            </div>
          )}
        </div>

        {/* Reaction chips below bubble */}
        {reactionChips.length > 0 && (
          <div className={`reaction-bar`} style={{ justifyContent: isSentByMe ? 'flex-end' : 'flex-start' }}>
            {reactionChips.map(({ emoji, count, mine }) => (
              <button
                key={emoji}
                className={`reaction-chip ${mine ? 'mine' : ''}`}
                onClick={() => onReact(msg.id, emoji)}
              >
                {emoji}
                {count > 1 && <span className="reaction-count">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
