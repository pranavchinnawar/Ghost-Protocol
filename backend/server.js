const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 2e6 // 2MB limit for Base64 images/audio
});

// In-Memory Storage
const rooms = {};
let matchmakingQueue = []; // [{ id, username }]
const ROOM_LIFETIME = 15 * 60 * 1000; // 15 minutes

io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ─── JOIN ROOM ────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, username, topic }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      const timeoutObj = setTimeout(() => closeRoom(roomId), ROOM_LIFETIME);
      rooms[roomId] = {
        topic,
        users: [],
        messages: [],
        reactions: {}, // messageId -> { emoji: [usernames] }
        expiresAt: Date.now() + ROOM_LIFETIME,
        timeoutObj
      };
      console.log(`[Room] Created: ${roomId}`);
    }

    if (!rooms[roomId].users.find(u => u.id === socket.id)) {
      rooms[roomId].users.push({ id: socket.id, username });
    }

    // Send existing state to new user
    socket.emit('room_setup', {
      messages: rooms[roomId].messages,
      expiresAt: rooms[roomId].expiresAt,
      reactions: rooms[roomId].reactions
    });

    // Toast notification to others
    socket.to(roomId).emit('toast', {
      type: 'join',
      text: `${username} slipped into the shadows`
    });

    io.to(roomId).emit('update_users', rooms[roomId].users);
  });

  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────
  socket.on('send_message', ({ roomId, message, username, type, content }) => {
    if (!rooms[roomId]) return;
    const msgData = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: message,
      type: type || 'text',
      content: content || null,
      username,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };
    rooms[roomId].messages.push(msgData);
    io.to(roomId).emit('receive_message', msgData);
  });

  // ─── TYPING INDICATOR ─────────────────────────────────────────────────────
  socket.on('typing_start', ({ roomId, username }) => {
    socket.to(roomId).emit('user_typing', { username });
  });

  socket.on('typing_stop', ({ roomId, username }) => {
    socket.to(roomId).emit('user_stopped_typing', { username });
  });

  // ─── REACTIONS ────────────────────────────────────────────────────────────
  socket.on('add_reaction', ({ roomId, messageId, emoji, username }) => {
    if (!rooms[roomId]) return;
    if (!rooms[roomId].reactions[messageId]) {
      rooms[roomId].reactions[messageId] = {};
    }
    const msgReactions = rooms[roomId].reactions[messageId];
    if (!msgReactions[emoji]) msgReactions[emoji] = [];

    // Toggle reaction
    const idx = msgReactions[emoji].indexOf(username);
    if (idx > -1) {
      msgReactions[emoji].splice(idx, 1);
      if (msgReactions[emoji].length === 0) delete msgReactions[emoji];
    } else {
      msgReactions[emoji].push(username);
    }

    io.to(roomId).emit('update_reactions', {
      messageId,
      reactions: rooms[roomId].reactions[messageId] || {}
    });
  });

  // ─── LEAVE ROOM ──────────────────────────────────────────────────────────
  socket.on('leave_room', ({ roomId, username }) => {
    handleUserLeave(socket.id, roomId, username);
    socket.leave(roomId);
  });

  // ─── MATCHMAKING & WEB-RTC ────────────────────────────────────────────────
  socket.on('join_matchmaking', ({ username }) => {
    if (matchmakingQueue.find(u => u.id === socket.id)) return;

    if (matchmakingQueue.length > 0) {
      const partner = matchmakingQueue.shift();
      const callId = `call-${Date.now()}`;
      
      // Notify both. Initiator will create the offer.
      io.to(socket.id).emit('match_found', { 
        remoteId: partner.id, 
        remoteUsername: partner.username,
        initiator: true,
        callId
      });
      io.to(partner.id).emit('match_found', { 
        remoteId: socket.id, 
        remoteUsername: username,
        initiator: false,
        callId
      });
      console.log(`[Matchmaking] Paired: ${username} <-> ${partner.username}`);
    } else {
      matchmakingQueue.push({ id: socket.id, username });
      console.log(`[Matchmaking] Waiting: ${username}`);
    }
  });

  socket.on('leave_matchmaking', () => {
    matchmakingQueue = matchmakingQueue.filter(u => u.id !== socket.id);
  });

  socket.on('web_signal', ({ to, signal }) => {
    io.to(to).emit('web_signal', { from: socket.id, signal });
  });

  socket.on('end_call', ({ to }) => {
    io.to(to).emit('end_call');
  });

  // ─── DISCONNECT ──────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    
    // Clear from matchmaking
    matchmakingQueue = matchmakingQueue.filter(u => u.id !== socket.id);

    for (const roomId in rooms) {
      const user = rooms[roomId].users.find(u => u.id === socket.id);
      if (user) handleUserLeave(socket.id, roomId, user.username);
    }
  });
});

function handleUserLeave(socketId, roomId, username) {
  if (!rooms[roomId]) return;
  rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== socketId);

  io.to(roomId).emit('toast', {
    type: 'leave',
    text: `${username} vanished into the void`
  });
  io.to(roomId).emit('update_users', rooms[roomId].users);

  if (rooms[roomId].users.length === 0) {
    clearTimeout(rooms[roomId].timeoutObj);
    delete rooms[roomId];
    console.log(`[Room] Cleaned up: ${roomId}`);
  }
}

function closeRoom(roomId) {
  if (!rooms[roomId]) return;
  io.to(roomId).emit('room_expired');
  const sockets = io.sockets.adapter.rooms.get(roomId);
  if (sockets) {
    for (const socketId of sockets) {
      try { io.sockets.sockets.get(socketId)?.leave(roomId); } catch (e) {}
    }
  }
  delete rooms[roomId];
  console.log(`[Room] Expired: ${roomId}`);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Ghost Protocol Server on :${PORT}`));
