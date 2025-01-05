import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const whiteboardStates: { [key: string]: any[] } = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (sessionId) => {
        socket.join(sessionId);
        console.log(`User ${socket.id} joined room: ${sessionId}`);

        if (whiteboardStates[sessionId]) {
            socket.emit('draw-update', whiteboardStates[sessionId]);
        }
    });

    socket.on('draw', ({ sessionId, elements }) => {
        whiteboardStates[sessionId] = elements;
        socket.to(sessionId).emit('draw-update', elements);
    });

    socket.on('cursor-move', ({ sessionId, userId, username, x, y }) => {
        socket.to(sessionId).emit('cursor-move', { userId, username, x, y });
    });

    socket.on('clear', (sessionId) => {
        whiteboardStates[sessionId] = [];
        socket.to(sessionId).emit('draw-update', []);
    });

    socket.on('leave-room', (sessionId) => {
        socket.leave(sessionId);
        console.log(`User ${socket.id} left room: ${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
