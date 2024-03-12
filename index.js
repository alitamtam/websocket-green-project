import 'dotenv/config';
import { Server as WebSocketServer } from 'socket.io';

import { createServer } from 'node:http';

import expressApp from './app/express.app.js';
import socketApp from './app/socketio.app.js';

const httpServer = createServer(expressApp);

// Pour créer un server websocket on fourni a celui-ci le server HTTP
const io = new WebSocketServer(httpServer);

socketApp(io);


const HTTP_PORT = process.env.HTTP_PORT || 3000;

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP Server launched on http://localhost:${HTTP_PORT}`);
});
