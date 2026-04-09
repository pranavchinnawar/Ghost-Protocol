import { io } from 'socket.io-client';

// 'http://localhost:3001' is the backend server URL
const URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_BACKEND_URL 
  : 'http://localhost:3001';

export const socket = io(URL, {
  autoConnect: false // We will connect manually when entering the app
});
