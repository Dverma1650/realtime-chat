# ⚡ Real-Time Chat Application

A real-time chat application built to understand and implement **WebSocket communication** using React, TypeScript, Node.js, and the native WebSocket API.

The project focuses on understanding how real-time communication works between multiple clients without using Socket.IO.

---

## 🚀 Features

- Real-time messaging using WebSockets
- Multiple users can join the chat
- Online users list
- Real-time typing indicator
- Debounced typing events
- Unique message IDs
- Server-generated message timestamps
- Message timestamps in the UI
- Automatic scroll to the latest message
- Connection status indicator
- Responsive chat interface
- TypeScript on both frontend and backend

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- WebSocket API
- CSS

### Backend

- Node.js
- TypeScript
- `ws` WebSocket library

---

## 🏗️ Architecture

```text
                    WebSocket Connection
                           │
                           │
                           ▼
┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │
│  React Client 1  │◄───►│                  │
│                  │     │                  │
└──────────────────┘     │                  │
                         │   Node.js        │
┌──────────────────┐     │   WebSocket      │
│                  │     │   Server         │
│  React Client 2  │◄───►│                  │
│                  │     │                  │
└──────────────────┘     │                  │
                         └──────────────────┘
                                  │
                                  │
                                  ▼
                           Broadcast Messages
```
