import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { playSound } from '../utils/sound';
import Header from '../components/Header';
import MessageBubble from '../components/MessageBubble';
import ToastContainer from '../components/ToastContainer';
import { Skull, Send, ShieldAlert, Image, Music, Mic, Square, X } from 'lucide-react';

const BAD_WORDS = ['badword', 'hate', 'spam', 'idiot', 'stupid'];

function filterBadWords(text) {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    filtered = filtered.replace(new RegExp(`\\b${word}\\b`, 'gi'), '***');
  });
  return filtered;
}

export default function ChatRoom({ username, onChangeUsername }) {
  const { roomId } = useParams();
  const navigate  = useNavigate();

  const [messages, setMessages]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [reactions, setReactions]   = useState({});
  const [inputValue, setInputValue] = useState('');
  const [timeLeft, setTimeLeft]     = useState(null);
  const [totalTime]                 = useState(15 * 60 * 1000);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef    = useRef(false);
  const fileInputRef   = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);

  // ── Socket Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!username) { navigate('/'); return; }
    if (!socket.connected) socket.connect();

    socket.emit('join_room', { roomId, username, topic: roomId });

    socket.on('room_setup', ({ messages: msgs, expiresAt, reactions: rxns }) => {
      setMessages(msgs);
      setReactions(rxns || {});
      const rem = expiresAt - Date.now();
      setTimeLeft(rem > 0 ? rem : 0);
    });

    socket.on('receive_message', msg => {
      setMessages(prev => [...prev, msg]);
      if (msg.username !== username && !msg.isSystem) {
        playSound('message');
      }
    });

    socket.on('update_users', updatedUsers => setUsers(updatedUsers));

    socket.on('update_reactions', ({ messageId, reactions: rxn }) => {
      setReactions(prev => ({ ...prev, [messageId]: rxn }));
    });

    socket.on('user_typing', ({ username: who }) => {
      setTypingUsers(prev => prev.includes(who) ? prev : [...prev, who]);
    });

    socket.on('user_stopped_typing', ({ username: who }) => {
      setTypingUsers(prev => prev.filter(u => u !== who));
    });

    socket.on('toast', ({ type, text }) => {
      window.__addToast?.({ type, text });
      playSound(type === 'join' ? 'join' : 'leave');
    });

    socket.on('room_expired', () => {
      window.__addToast?.({ type: 'leave', text: 'Ghost space expired. Returning to shadows...' });
      setTimeout(() => navigate('/'), 2500);
    });

    return () => {
      socket.off('room_setup');
      socket.off('receive_message');
      socket.off('update_users');
      socket.off('update_reactions');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('toast');
      socket.off('room_expired');
      socket.emit('leave_room', { roomId, username });
    };
  }, [roomId, username, navigate]);

  // ── Timers ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(s => {
          if (s >= 44) {
            stopRecording();
            return 45;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send Message ──────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || timeLeft === 0) return;
    const filtered = filterBadWords(inputValue.trim());
    socket.emit('send_message', { roomId, message: filtered, username });
    setInputValue('');
    stopTyping();
  };

  // ── Typing Indicator ──────────────────────────────────────────────────────
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { roomId, username });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2000);
  }, [roomId, username]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing_stop', { roomId, username });
    }
    clearTimeout(typingTimerRef.current);
  }, [roomId, username]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value) startTyping();
    else stopTyping();
  };

  // ── Reactions ─────────────────────────────────────────────────────────────
  const handleReact = useCallback((messageId, emoji) => {
    socket.emit('add_reaction', { roomId, messageId, emoji, username });
  }, [roomId, username]);

  // ── Panic Exit ────────────────────────────────────────────────────────────
  const handlePanicExit = () => {
    socket.emit('leave_room', { roomId, username });
    navigate('/');
  };

  // ── Voice Recording ───────────────────────────────────────────────────────
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          socket.emit('send_message', {
            roomId,
            type: 'audio',
            content: event.target.result,
            username,
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      if (isTypingRef.current) stopTyping();
    } catch (err) {
      window.__addToast?.({ type: 'leave', text: 'Microphone access denied.' });
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error('Stop recording error:', err);
    } finally {
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    } catch (err) {
      console.error('Cancel recording error:', err);
    } finally {
      setIsRecording(false);
      window.__addToast?.({ type: 'leave', text: 'Recording discarded.' });
    }
  };

  // ── Media Uploads ─────────────────────────────────────────────────────────
  const handleFileClick = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.__addToast?.({ type: 'leave', text: 'Ghost limit: 2MB max per file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : null;
      if (!type) {
        window.__addToast?.({ type: 'leave', text: 'Invalid file type.' });
        return;
      }
      socket.emit('send_message', {
        roomId,
        type,
        content: event.target.result,
        username,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const timerPct   = timeLeft ? Math.max((timeLeft / totalTime) * 100, 0) : 0;
  const timerColor = timerPct < 20 ? 'var(--danger)' : 'var(--accent-secondary)';
  const timerGlow  = timerPct < 20 ? 'var(--danger-glow)' : 'var(--accent-secondary-glow)';

  const otherTyping = typingUsers.filter(u => u !== username);
  const typingLabel = otherTyping.length === 1
    ? `${otherTyping[0]} is typing`
    : otherTyping.length > 1
      ? `${otherTyping.length} people are typing`
      : '';

  return (
    <div className="page">
      <Header username={username} onChangeUsername={onChangeUsername} />
      <ToastContainer />

      <div className="chat-wrapper">
        <div className="chat-container">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="topic-badge">#{roomId}</span>
              <span className="participants-badge">{users.length} online</span>
            </div>
            <div className="header-right">
              <div className="timer-block">
                <Skull size={13} />
                {formatTime(timeLeft)}
              </div>
              <button className="btn-danger" onClick={handlePanicExit}>
                <ShieldAlert size={14} /> Exit Now
              </button>
            </div>
          </div>

          <div className="timer-bar-container">
            <div
              className="timer-bar-fill"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                boxShadow: `0 0 8px ${timerGlow}`,
              }}
            />
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id || i}
                msg={msg}
                currentUsername={username}
                onReact={handleReact}
                reactions={reactions[msg.id] || {}}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="typing-indicator">
            {typingLabel && (
              <>
                <div className="typing-dot" />
                <span className="typing-text">{typingLabel}...</span>
              </>
            )}
          </div>

          <div className="chat-input-container">
            {isRecording && (
              <div className="recording-bar">
                <div className="recording-status">
                  <div className="recording-dot" />
                  <span>Recording Ghost Note...</span>
                </div>
                <div className="recording-time">0:{recordingSeconds.toString().padStart(2, '0')}</div>
                <button className="btn-cancel-recording" onClick={cancelRecording}>
                  Discard
                </button>
              </div>
            )}

            <form className="chat-input-area" onSubmit={handleSend}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileSelect}
              />
              
              <button 
                type="button" 
                className="btn-icon-accessory" 
                onClick={() => handleFileClick('image/*')}
                title="Add image"
                disabled={timeLeft === 0 || isRecording}
              >
                <Image size={20} />
              </button>

              <button 
                type="button" 
                className="btn-icon-accessory" 
                onClick={() => handleFileClick('audio/*')}
                title="Add audio file"
                disabled={timeLeft === 0 || isRecording}
              >
                <Music size={20} />
              </button>

              <button 
                type="button" 
                className={`btn-icon-accessory ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : handleStartRecording}
                title={isRecording ? "Stop Recording" : "Record Voice Note"}
                disabled={timeLeft === 0}
              >
                {isRecording ? <Square size={20} color="var(--danger)" /> : <Mic size={20} />}
              </button>

              <input
                type="text"
                className="chat-input"
                placeholder={isRecording ? "Recording in progress..." : "Type anonymously..."}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={stopTyping}
                disabled={timeLeft === 0 || isRecording}
                maxLength={400}
                autoComplete="off"
              />
              <button type="submit" className="btn-send" disabled={timeLeft === 0 || !inputValue.trim() || isRecording}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        <div className="users-sidebar">
          <h4>👥 Ghosts Online</h4>
          {users.map(u => (
            <div key={u.id} className="user-item">
              <div className="user-avatar">
                {u.username.slice(0, 2).toUpperCase()}
              </div>
              <span className={`user-name ${u.username === username ? 'is-me' : ''}`}>
                {u.username}{u.username === username ? ' (you)' : ''}
              </span>
              <span className="user-online-dot" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
