import * as React from 'react';
const { useState, useEffect, useRef } = React;
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import './App.css';

interface Message {
  user: string;
  text: string;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
}

interface UserTyping {
  user: string;
  isTyping: boolean;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [joined, setJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to socket server
  useEffect(() => {
    try {
      console.log('Connecting to WebSocket server...');
      const newSocket = io('http://192.168.243.242:3001', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        timeout: 10000
      });
      
      newSocket.on('connect', () => {
        console.log('Connected to server successfully');
        setError(null);
      });
      
      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setError(`Failed to connect: ${err.message}`);
      });

      setSocket(newSocket);

      // Clean up on unmount
      return () => {
        console.log('Disconnecting from server...');
        newSocket.disconnect();
      };
    } catch (error: any) {
      console.error('Socket initialization error:', error);
      setError(`Failed to initialize socket: ${error.message || 'Unknown error'}`);
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle initial data when joining
    socket.on('initialData', (data: { users: User[], messages: Message[] }) => {
      setUsers(data.users);
      setMessages(data.messages);
    });

    // Handle incoming messages
    socket.on('message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Handle user join
    socket.on('userJoined', (user: User) => {
      setUsers((prev) => [...prev, user]);
    });

    // Handle user leave
    socket.on('userLeft', (user: { id: string, name: string }) => {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    });

    // Handle typing indicators
    socket.on('userTyping', (data: UserTyping) => {
      if (data.isTyping) {
        setTypingUsers((prev) => 
          prev.includes(data.user) ? prev : [...prev, data.user]
        );
      } else {
        setTypingUsers((prev) => prev.filter((name) => name !== data.user));
      }
    });

    // Handle connection errors
    socket.on('connect_error', () => {
      setError('Failed to connect to server');
    });

    return () => {
      socket.off('initialData');
      socket.off('message');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('userTyping');
      socket.off('connect_error');
    };
  }, [socket]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle joining the chat
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !socket) return;
    
    socket.emit('join', username);
    setJoined(true);
  };

  // Handle sending messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    
    socket.emit('sendMessage', message);
    setMessage('');
  };

  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (socket) {
      socket.emit('typing', e.target.value.length > 0);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!joined) {
    return (
      <div className="login-container">
        <h1>Join the Chat</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          <button type="submit">Join</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat Room</h2>
        <div className="user-count">
          <span>{users.length} online</span>
        </div>
      </div>
      
      <div className="chat-main">
        <div className="chat-sidebar">
          <h3>Active Users</h3>
          <ul className="users-list">
            {users.map((user) => (
              <li key={user.id} className={user.name === username ? 'current-user' : ''}>
                {user.name} {user.name === username && '(You)'}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.user === username ? 'my-message' : ''}`}>
              <div className="message-header">
                <span className="username">{msg.user === username ? 'You' : msg.user}</span>
                <span className="time">{formatTime(msg.timestamp)}</span>
              </div>
              <p className="message-text">{msg.text}</p>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...` 
                : `${typingUsers.length} people are typing...`}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="chat-form-container">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={handleTyping}
            placeholder="Type a message..."
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
