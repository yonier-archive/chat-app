import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);

  const connect = () => {
    socket.value = io(SOCKET_URL);

    socket.value.on('connect', () => {
      isConnected.value = true;
      console.log('Connected to server');
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
      console.log('Disconnected from server');
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    connect,
    disconnect
  };
}
