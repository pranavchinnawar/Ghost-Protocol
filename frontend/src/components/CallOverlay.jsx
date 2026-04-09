import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { socket } from '../socket';

export default function CallOverlay({ remoteId, remoteUsername, initiator, onEnd }) {
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Connecting Frequency...');
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        // Add tracks
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Remote tracks
        pc.ontrack = (event) => {
          const remoteAudio = new Audio();
          remoteAudio.srcObject = event.streams[0];
          remoteAudio.play().catch(e => console.error('Audio play failed:', e));
          setStatus('Ghost Connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('web_signal', { to: remoteId, signal: { candidate: event.candidate } });
          }
        };

        socket.on('web_signal', async ({ from, signal }) => {
          if (from !== remoteId) return;

          if (signal.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            if (signal.sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('web_signal', { to: remoteId, signal: { sdp: answer } });
            }
          } else if (signal.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn('ICE candidate error:', e);
            }
          }
        });

        socket.on('end_call', () => {
          onEnd();
        });

        // Start connection
        if (initiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('web_signal', { to: remoteId, signal: { sdp: offer } });
        }

      } catch (err) {
        console.error('Call initialization failed:', err);
        window.__addToast?.({ type: 'leave', text: 'Mic access required for calls.' });
        onEnd();
      }
    };

    initCall();

    return () => {
      socket.off('web_signal');
      socket.off('end_call');
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, [remoteId, initiator, onEnd]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  const handleHangup = () => {
    socket.emit('end_call', { to: remoteId });
    onEnd();
  };

  return (
    <div className="call-overlay">
      <div className="call-content">
        <div className="ghost-avatar-lg">
          {remoteUsername.slice(0, 2).toUpperCase()}
          <div className="call-rings" />
          <div className="call-rings" />
          <div className="call-rings" />
        </div>
        <h2 className="call-title">Voice of {remoteUsername}</h2>
        <p className="call-status">{status}</p>

        <div className="call-controls">
          <button 
            className={`btn-call-action mute ${isMuted ? 'active' : ''}`} 
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <button className="btn-call-action hangup" onClick={handleHangup} title="End Call">
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
