const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // We'll update this once the frontend URL is established
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join a specific group room
    socket.on('join_group', (groupId) => {
      socket.join(groupId);
      console.log(`👥 User ${socket.id} joined group room: ${groupId}`);
    });

    // Leave a specific group room
    socket.on('leave_group', (groupId) => {
      socket.leave(groupId);
      console.log(`🏃 User ${socket.id} left group room: ${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
