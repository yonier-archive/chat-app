<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useSocket } from '../composables/useSocket';
import EmojiPicker from './EmojiPicker.vue';

interface Message {
  id: string;
  username: string;
  message: string;
  createdAt: string;
}

interface User {
  username: string;
  isOnline: boolean;
}

const { socket, isConnected } = useSocket();

const username = ref('');
const hasJoined = ref(false);
const messages = ref<Message[]>([]);
const onlineUsers = ref<User[]>([]);
const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const onlineUserCount = computed(() => onlineUsers.value.filter(u => u.isOnline).length);

const joinChat = () => {
  if (!username.value.trim() || !socket.value) return;

  socket.value.emit('user:join', { username: username.value });

  socket.value.on('user:joined', () => {
    hasJoined.value = true;
    loadMessages();
  });

  socket.value.on('message:new', (message: Message) => {
    messages.value.push(message);
    nextTick(() => scrollToBottom());
  });

  socket.value.on('users:update', (users: User[]) => {
    onlineUsers.value = users;
  });
};

const loadMessages = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/messages');
    const data = await response.json();
    messages.value = data;
    nextTick(() => scrollToBottom());
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !socket.value) return;

  socket.value.emit('message:send', {
    username: username.value,
    message: newMessage.value
  });

  newMessage.value = '';
};

const addEmoji = (emoji: string) => {
  newMessage.value += emoji;
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  if (socket.value) {
    socket.value.on('connect', () => {
      if (hasJoined.value) {
        socket.value?.emit('user:join', { username: username.value });
      }
    });
  }
});
</script>

<template>
  <div class="chat-container">
    <div v-if="!hasJoined" class="join-screen">
      <div class="join-card">
        <h1>Welcome to Chat</h1>
        <p>Enter your username to join the conversation</p>
        <form @submit.prevent="joinChat">
          <input
            v-model="username"
            type="text"
            placeholder="Enter username..."
            class="username-input"
            maxlength="20"
            required
          />
          <button type="submit" class="join-button" :disabled="!isConnected">
            {{ isConnected ? 'Join Chat' : 'Connecting...' }}
          </button>
        </form>
      </div>
    </div>

    <div v-else class="chat-layout">
      <aside class="users-sidebar">
        <div class="sidebar-header">
          <h2>Online Users</h2>
          <span class="user-count">{{ onlineUserCount }}</span>
        </div>
        <div class="users-list">
          <div
            v-for="user in onlineUsers"
            :key="user.username"
            class="user-item"
            :class="{ 'is-you': user.username === username }"
          >
            <div class="user-status" :class="{ online: user.isOnline }"></div>
            <span class="user-name">{{ user.username }}</span>
            <span v-if="user.username === username" class="you-badge">(you)</span>
          </div>
        </div>
      </aside>

      <main class="chat-main">
        <div class="chat-header">
          <h2>Chat Room</h2>
          <div class="connection-status" :class="{ connected: isConnected }">
            {{ isConnected ? 'Connected' : 'Disconnected' }}
          </div>
        </div>

        <div ref="messagesContainer" class="messages-container">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="{ 'own-message': message.username === username }"
          >
            <div class="message-header">
              <span class="message-username">{{ message.username }}</span>
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            </div>
            <div class="message-content">{{ message.message }}</div>
          </div>
        </div>

        <form @submit.prevent="sendMessage" class="message-form">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type a message..."
            class="message-input"
            maxlength="500"
          />
          <EmojiPicker @select="addEmoji" />
          <button type="submit" class="send-button" :disabled="!newMessage.trim()">
            Send
          </button>
        </form>
      </main>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.join-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--primary);
}

.join-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.join-card h1 {
  margin: 0 0 0.5rem;
  color: #2d3748;
  font-size: 2rem;
}

.join-card p {
  color: #718096;
  margin-bottom: 2rem;
}

.username-input {
  width: 100%;
  padding: 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}

.username-input:focus {
  outline: none;
  border-color: var(--primary);
}

.join-button {
  width: 100%;
  padding: 0.875rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.join-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
  background: #f7fafc;
}

.users-sidebar {
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.125rem;
  color: #2d3748;
}

.user-count {
  background: var(--primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.25rem;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #f7fafc;
}

.user-item.is-you {
  background: #edf2f7;
}

.user-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e0;
}

.user-status.online {
  background: #48bb78;
}

.user-name {
  flex: 1;
  font-weight: 500;
  color: #2d3748;
}

.you-badge {
  font-size: 0.75rem;
  color: #718096;
}

.chat-main {
  display: flex;
  flex-direction: column;
  background: white;
  min-width: 100%;
  max-height: 100dvh;
}

.chat-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.chat-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2d3748;
}

.connection-status {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #fed7d7;
  color: #c53030;
}

.connection-status.connected {
  background: #c6f6d5;
  color: #2f855a;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f7fafc;
}

.message {
  max-width: 70%;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.own-message {
  align-self: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.message-username {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--primary);
}

.own-message .message-username {
  color: black;
}

.message-time {
  font-size: 0.75rem;
  color: #a0aec0;
}

.message-content {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  color: #2d3748;
  line-height: 1.5;
}

.own-message .message-content {
  background: var(--primary);
  color: white;
}

.message-form {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: white;
}

.message-input {
  flex: 1;
  padding: 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: var(--primary);
}

.send-button {
  padding: 0.875rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .users-sidebar {
    display: none;
  }

  .message {
    max-width: 85%;
  }
}
</style>
