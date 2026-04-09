# 👻 Ghost Protocol

Ghost Protocol is a privacy-first, anonymous, real-time chat platform built with React, Node.js, and Socket.io. It features temporary sessions and zero permanent data storage — everything is stored exclusively in server RAM.

## 🚀 Key Features

- **Anonymous Identity**: No signup or login. A random "Ghost" identity is generated for you on every visit.
- **Topic-Based Rooms**: Join specialized channels for Study, Stress relief, or Fun.
- **Temporary Sessions**: Every chat room has a 15-minute countdown. When the timer hits zero, the room is deleted, and everyone is disconnected.
- **Privacy-First**: No database, no logs, and no history. Once a session ends or the server restarts, all data vanishes.
- **Premium Aesthetics**: A sleek dark mode UI with neon glows, animated particle backgrounds, and smooth transitions.
- **Modern Interactions**:
  - **Typing Indicators**: See when others are typing in real-time.
  - **Reactions**: Double-click any message to add an emoji reaction.
  - **Nickname Changes**: Edit your ghost name anytime via the header pencil icon.
  - **Sound Effects**: Audio cues for new messages and user activity.
  - **Panic Exit**: Instantly leave and clear your session with one click.

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, Socket.io-client, Lucide-React, CSS Transitions.
- **Backend**: Node.js, Express, Socket.io.
- **Storage**: In-Memory (JavaScript Objects/Arrays).

## 🔧 Installation & Setup

1. **Clone the repository** (or navigate to the project folder).
2. **Setup the Backend**:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   *The server will start on port 3001.*

3. **Setup the Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *The app will be available at http://localhost:5173.*

## 📂 Project Structure

```text
GhostProtocol/
├── backend/
│   ├── server.js        # Express & Socket.io logic + In-memory store
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/  # Header, MessageBubble, ParticleCanvas, etc.
    │   ├── pages/       # LandingPage, TopicSelection, ChatRoom
    │   ├── utils/       # Sound and helper utilities
    │   ├── socket.js    # Socket.io configuration
    │   ├── App.jsx      # Routing and State Management
    │   └── index.css    # Premium Design System
    └── package.json
```

## 🔒 Security Note
This project is for demonstration and temporary communication. It does not use end-to-end encryption (E2EE) but ensures privacy through **transience** — data that doesn't exist cannot be leaked.
