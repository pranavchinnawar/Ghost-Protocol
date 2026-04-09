import { useEffect, useState } from 'react';

let toastIdCounter = 0;

// Global toast emitter — call window.__addToast({ type, text }) from anywhere
export function useToastEmitter() {
  return (type, text) => {
    if (typeof window.__addToast === 'function') window.__addToast({ type, text });
  };
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.__addToast = ({ type, text }) => {
      const id = ++toastIdCounter;
      setToasts(prev => [...prev, { id, type, text, leaving: false }]);
      // Start leave animation after 2.5s, remove after 3s
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 350);
      }, 2500);
    };
    return () => { window.__addToast = null; };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type} ${t.leaving ? 'leaving' : 'entering'}`}
        >
          {t.type === 'join' ? '👻 ' : '💨 '}{t.text}
        </div>
      ))}
    </div>
  );
}
