import { join } from 'path';
import express, { json } from 'express';
import { WebSocketServer } from 'ws';
import apiRoutes from './routes/apiRouter.js';
import sttRoutes from './routes/sttRouter.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(json());
app.use(express.static(join(__dirname, 'public')));

// WebSocket 서버
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'info', message: 'STT 연결됨. [서버→클라이언트]' }));
});

const server = app.listen(3000, () => {
  console.log('✅ Server started on http://localhost:3000');
});

server.on('upgrade', (req, socket, head) => {
  if (req.url === '/stt') {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

app.use('/api', apiRoutes);
app.use('/api', sttRoutes(wss));