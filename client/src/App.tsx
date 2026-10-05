import { useEffect, useRef, useState } from "react";
import "./App.css";

type ChatMessage = {
  type: "message";
  messageId: string;
  username: string;
  text: string;
  timestamp: number;
};

type OnlineUsersMessage = {
  type: "online_users";
  users: string[];
};

type TypingMessage = {
  type: "typing";
  username: string;
  isTyping: boolean;
};

type ServerMessage = ChatMessage | OnlineUsersMessage | TypingMessage;

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const [username, setUsername] = useState("");

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const [typingUser, setTypingUser] = useState<string | null>(null);

  const [hasJoined, setHasJoined] = useState(false);

  const usernameRef = useRef("");

  const typingTimeoutRef = useRef<number | null>(null);

  // --------------------------------
  // WEBSOCKET CONNECTION
  // --------------------------------

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000");

    ws.onopen = () => {
      console.log("WebSocket connected");

      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerMessage = JSON.parse(event.data);

        console.log("Received:", data);

        // --------------------------------
        // CHAT MESSAGE
        // --------------------------------

        if (data.type === "message") {
          if (
            !data.messageId ||
            !data.username ||
            typeof data.timestamp !== "number"
          ) {
            console.error("Invalid chat message received:", data);

            return;
          }

          setMessages((previousMessages) => [...previousMessages, data]);

          return;
        }

        // --------------------------------
        // ONLINE USERS
        // --------------------------------

        if (data.type === "online_users") {
          setOnlineUsers(data.users);

          return;
        }

        // --------------------------------
        // TYPING
        // --------------------------------

        if (data.type === "typing") {
          if (data.username === usernameRef.current) {
            return;
          }

          if (data.isTyping) {
            setTypingUser(data.username);
          } else {
            setTypingUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");

      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  // --------------------------------
  // JOIN CHAT
  // --------------------------------

  const joinChat = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "join",
        username: trimmedUsername,
      })
    );

    usernameRef.current = trimmedUsername;

    setUsername(trimmedUsername);

    setHasJoined(true);
  };

  // --------------------------------
  // SEND MESSAGE
  // --------------------------------

  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage || !usernameRef.current) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "message",
        text: trimmedMessage,
      })
    );

    // Stop typing
    socket.send(
      JSON.stringify({
        type: "typing",
        isTyping: false,
      })
    );

    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = null;
    }

    setMessage("");
  };

  // --------------------------------
  // MESSAGE INPUT
  // --------------------------------

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setMessage(value);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!usernameRef.current) {
      return;
    }

    // User started typing
    if (value.trim()) {
      socket.send(
        JSON.stringify({
          type: "typing",
          isTyping: true,
        })
      );
    }

    // Clear previous timer
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1 second
    typingTimeoutRef.current = window.setTimeout(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "typing",
            isTyping: false,
          })
        );
      }

      typingTimeoutRef.current = null;
    }, 1000);
  };

  // --------------------------------
  // ENTER KEY
  // --------------------------------

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  // --------------------------------
  // FORMAT TIME
  // --------------------------------

  const formatTime = (timestamp: number) => {
    if (!timestamp || !Number.isFinite(timestamp)) {
      return "";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --------------------------------
  // JOIN SCREEN
  // --------------------------------

  if (!hasJoined) {
    return (
      <div className="join-page">
        <div className="join-card">
          <div className="logo">⚡</div>

          <h1>Real-Time Chat</h1>

          <p>Enter your name to join the conversation</p>

          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                joinChat();
              }
            }}
            placeholder="Enter your name"
          />

          <button onClick={joinChat}>Join Chat</button>

          <div className="connection-status">
            <span
              className={
                socket?.readyState === WebSocket.OPEN
                  ? "status-dot online"
                  : "status-dot"
              }
            />

            {socket?.readyState === WebSocket.OPEN
              ? "Connected to server"
              : "Connecting..."}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------
  // CHAT SCREEN
  // --------------------------------

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* HEADER */}

        <header className="chat-header">
          <div>
            <h1>⚡ Real-Time Chat</h1>

            <span>WebSocket Chat</span>
          </div>

          <div className="connection-status">
            <span className="status-dot online" />
            Connected
          </div>
        </header>

        <div className="chat-body">
          {/* SIDEBAR */}

          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>Online Users</h2>

              <span>{onlineUsers.length}</span>
            </div>

            <div className="user-list">
              {onlineUsers.map((user) => (
                <div className="user-item" key={user}>
                  <div className="avatar">{user.charAt(0).toUpperCase()}</div>

                  <div className="user-info">
                    <strong>{user}</strong>

                    <span>
                      <span className="small-online-dot" />
                      Online
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* CHAT */}

          <main className="chat-main">
            {/* CHAT HEADER */}

            <div className="chat-title">
              <div>
                <h2>General Chat</h2>

                <span>{onlineUsers.length} people online</span>
              </div>
            </div>

            {/* MESSAGES */}

            <div className="messages">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <div>💬</div>

                  <h3>No messages yet</h3>

                  <p>Start the conversation by sending a message.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.username === username;

                  return (
                    <div
                      className={`message-row ${isOwnMessage ? "own" : ""}`}
                      key={msg.messageId}
                    >
                      {!isOwnMessage && (
                        <div className="message-avatar">
                          {msg.username.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="message-content">
                        {!isOwnMessage && (
                          <span className="message-username">
                            {msg.username}
                          </span>
                        )}

                        <div className="message-bubble">{msg.text}</div>

                        <span className="message-time">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* TYPING INDICATOR */}

            {typingUser && (
              <div className="typing-indicator">{typingUser} is typing...</div>
            )}

            {/* INPUT */}

            <div className="message-input-container">
              <input
                type="text"
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
              />

              <button onClick={sendMessage} disabled={!message.trim()}>
                Send
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
