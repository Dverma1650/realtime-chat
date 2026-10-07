import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "node:crypto";
import { getAIResponse } from "./services/ai.service";

const PORT = 8000;

const wss = new WebSocketServer({
  port: PORT,
});

const users = new Map<WebSocket, string>();

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// --------------------------------
// BROADCAST
// --------------------------------

function broadcast(data: object) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// --------------------------------
// ONLINE USERS
// --------------------------------

function broadcastOnlineUsers() {
  const onlineUsers = Array.from(users.values());

  broadcast({
    type: "online_users",
    users: onlineUsers,
  });
}

// --------------------------------
// WEBSOCKET CONNECTION
// --------------------------------

wss.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (message) => {
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

        const text = data.text.trim();

        // --------------------------------
        // USER MESSAGE
        // --------------------------------

        const chatMessage = {
          type: "message",
          messageId: crypto.randomUUID(),
          username,
          text,
          timestamp: Date.now(),
        };

        console.log("Broadcasting message:", chatMessage);

        // Send user message to everyone
        broadcast(chatMessage);

        // --------------------------------
        // AI RESPONSE
        // --------------------------------

        try {
          console.log("Sending message to AI...");

          const aiResponse = await getAIResponse(text);

          console.log("AI response:", aiResponse);

          // Send AI response to everyone
          broadcast({
            type: "ai_response",
            messageId: crypto.randomUUID(),
            username: "AI",
            text: aiResponse,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error("AI error:", error);

          // Send error only to the user who asked
          socket.send(
            JSON.stringify({
              type: "ai_error",
              message: "Sorry, something went wrong with the AI.",
            })
          );
        }

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
