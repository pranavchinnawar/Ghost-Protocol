# 👻 Ghost Protocol
> **Anonymous. Transient. Real-Time.**

Ghost Protocol is a privacy-first, anonymous, real-time chat platform built with React, Node.js, and Socket.io. It features temporary sessions and zero permanent data storage — everything is stored exclusively in server RAM.

🔗 **[Live Demo: ghost-protocol-khaki.vercel.app](https://ghost-protocol-khaki.vercel.app)**

---

## 📸 Screen Gallery

| Landing Page | Chat Experience | Matchmaking Calls |
| :---: | :---: | :---: |
| ![Landing](/artifacts/landing_page_upgraded_1775638878849.png) | ![Multimedia](/artifacts/message_sent_upgraded_1775638961125.png) | ![Voice Call](/artifacts/ghost_voicenote_verify_1775646700855.webp) |

---

## 🚀 Key Features

- **🌐 Live Matchmaking Calls**: Find a "Ghost Frequency" and connect via P2P WebRTC audio with a random stranger globally.
- **🎙️ Voice Ghost Notes**: Record and send transient audio clips with a sleek, pulsing recording interface.
- **🖼️ Multimedia Sharing**: Instant image and audio file broadcasting (up to 2MB) with zero server-side storage.
- **🎭 Anonymous Identity**: Automatic "Ghost" identities generated on every visit. No logs, no tracking.
- **⏳ Temporary Sessions**: 15-minute room timers. When time is up, the room is purged and everyone is disconnected.
- **⚡ Modern Interactions**:
  - **Reactions**: Double-click any message to add high-impact emoji reactions.
  - **Typing Indicators**: Real-time feedback when other ghosts are active.
  - **Panic Exit**: Instantly clear your session and vanish with one click.
  - **Sound Scape**: Immersive audio cues for a premium UX.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Socket.io-client, Lucide-React, Web Audio API, WebRTC.
- **Backend**: Node.js, Express, Socket.io (Configured for 2MB payloads).
- **Styling**: Vanilla CSS (Custom Neon/Cyber-Ghost Design System).

## 🔧 Local Setup

1. **Install Root**: `npm run install:all`
2. **Start Backend**: `npm run dev:backend` (Port 3001)
3. **Start Frontend**: `npm run dev:frontend` (Port 5173)

---

## 🌎 Deployment (Vercel + Render)

Ghost Protocol uses a **Hybrid Deployment** setup:
- **Backend (Render)**: Processes matchmaking and real-time signaling.
- **Frontend (Vercel)**: Serves the high-speed React application.

**Env Variable Required**: `VITE_BACKEND_URL` (Points to your Render instance).

## 🔒 Security & Privacy
This project is built for **transience**. All messages, images, and voice notes exist only in the temporary memory of active participants and are wiped as soon as the session expires. Data that doesn't exist cannot be leaked.
