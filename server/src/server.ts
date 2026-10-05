import { WebSocketServer, WebSocket } from "ws";
import crypto from "node:crypto";

const PORT = 8000;

const wss = new WebSocketServer({
  port: PORT,
});

const users = new Map<WebSocket, string>();

console.log(`WebSocket server running on ws://localhost:${PORT}`);

function broadcast(data: object) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastOnlineUsers() {
  const onlineUsers = Array.from(users.values());

  broadcast({
    type: "online_users",
    users: onlineUsers,
  });
}

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("Received:", data);

      // --------------------------------
      // USER JOIN
      // --------------------------------

      if (data.type === "join") {
        if (!data.username?.trim()) {
          return;
        }

        const username = data.username.trim();

        users.set(socket, username);

        console.log(`${username} joined`);

        broadcastOnlineUsers();

        return;
      }

      // --------------------------------
      // CHAT MESSAGE
      // --------------------------------

      if (data.type === "message") {
        if (!data.text?.trim()) {
          return;
        }

        const username = users.get(socket);

        if (!username) {
          return;
        }

        const chatMessage = {
          type: "message",
          messageId: crypto.randomUUID(),
          username,
          text: data.text.trim(),
          timestamp: Date.now(),
        };

        console.log("Broadcasting message:", chatMessage);

        broadcast(chatMessage);

        return;
      }

      // --------------------------------
      // TYPING
      // --------------------------------

      if (data.type === "typing") {
        const username = users.get(socket);

        if (!username) {
          return;
        }

        broadcast({
          type: "typing",
          username,
          isTyping: Boolean(data.isTyping),
        });

        return;
      }
    } catch (error) {
      console.error("Invalid message received:", error);
    }
  });

  // --------------------------------
  // DISCONNECT
  // --------------------------------

  socket.on("close", () => {
    const username = users.get(socket);

    if (username) {
      console.log(`${username} disconnected`);

      users.delete(socket);

      broadcastOnlineUsers();
    }
  });

  // --------------------------------
  // ERROR
  // --------------------------------

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
