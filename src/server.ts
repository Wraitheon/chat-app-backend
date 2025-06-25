import http from 'http'; // Import the native http module
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import config from './config';
import sequelize from './lib/sequelize';
import { setup_socket_io } from './sockets/socket.handler'; // Import our new handler

// --- Create the HTTP server from the Express app ---
const http_server = http.createServer(app);

// --- Initialize Socket.IO and attach it to the HTTP server ---
const io = new SocketIOServer(http_server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    credentials: true,
  },
});

// --- Pass the io instance to our dedicated setup function ---
setup_socket_io(io);

// --- Start the server ---
(async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // --- Listen on the httpServer, NOT the express app ---
    http_server.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
      console.log('Nodemon is active and watching for changes. Press Ctrl-C to stop.');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();