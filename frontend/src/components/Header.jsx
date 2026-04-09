import { useState, useRef } from 'react';
import { Skull, Pencil, Check, X } from 'lucide-react';

export default function Header({ username, onChangeUsername }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const inputRef              = useRef(null);

  const startEdit = () => {
    setDraft(username || '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const confirmEdit = () => {
    if (onChangeUsername) onChangeUsername(draft);
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const handleKey = (e) => {
    if (e.key === 'Enter')  confirmEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <header className="header-wrapper">
      {/* Logo */}
      <div className="logo-text">
        <Skull size={24} color="var(--accent-primary)" strokeWidth={1.5} />
        <span>Ghost Protocol</span>
      </div>

      {/* Username editor */}
      {username && (
        <div className="username-editor">
          {editing ? (
            <>
              <input
                ref={inputRef}
                className="username-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKey}
                maxLength={24}
                placeholder="New nickname…"
              />
              <button className="icon-btn success" onClick={confirmEdit} title="Save">
                <Check size={15} />
              </button>
              <button className="icon-btn danger" onClick={cancelEdit} title="Cancel">
                <X size={15} />
              </button>
            </>
          ) : (
            <>
              <span className="header-username">{username}</span>
              <button className="icon-btn muted" onClick={startEdit} title="Change nickname">
                <Pencil size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
