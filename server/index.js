import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(__dirname, '..'));

const app = express();
const httpServer = createServer(app);

const prisma = new PrismaClient();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      take: 100,
      orderBy: { createdAt: 'asc' },
      include: { user: true }
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user:join', async ({ username }) => {
    try {
      let user = await prisma.user.findUnique({
        where: { username }
      });

      let userId;
      if (user) {
        userId = user.id;
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: true, lastSeen: new Date() }
        });
      } else {
        const newUser = await prisma.user.create({
          data: { username, isOnline: true }
        });
        userId = newUser.id;
      }

      connectedUsers.set(socket.id, { userId, username });
      socket.username = username;

      const onlineUsers = await prisma.user.findMany({
        where: { isOnline: true },
        select: { username: true, isOnline: true }
      });

      io.emit('users:update', onlineUsers);

      socket.emit('user:joined', { username, userId });
    } catch (error) {
      console.error('Error joining user:', error);
    }
  });

  socket.on('message:send', async ({ username, message }) => {
    try {
      const userInfo = connectedUsers.get(socket.id);
      if (!userInfo) return;

      const newMessage = await prisma.message.create({
        data: {
          userId: userInfo.userId,
          username,
          message
        },
        include: { user: true }
      });

      io.emit('message:new', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', async () => {
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      try {
        await prisma.user.update({
          where: { id: userInfo.userId },
          data: { isOnline: false, lastSeen: new Date() }
        });

        connectedUsers.delete(socket.id);

        const onlineUsers = await prisma.user.findMany({
          where: { isOnline: true },
          select: { username: true, isOnline: true }
        });

        io.emit('users:update', onlineUsers);
      } catch (error) {
        console.error('Error disconnecting user:', error);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});