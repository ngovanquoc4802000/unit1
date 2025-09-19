import { join } from 'path';
import express, { json } from 'express';
import apiRoutes from './routes/apiRouter.js';
import sttRoutes from './routes/sttRouter.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import WebSocket, { WebSocketServer } from "ws";
import mqtt from "mqtt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(json());
app.use(express.static(join(__dirname, 'public')));

// ✅ MQTT 연결
const mqttClient = mqtt.connect('mqtt://112.218.159.227:1883', {
  username: 'mijuit',
  password: 'admin@123'
});

mqttClient.on('connect', () => {
  
  console.log('✅ MQTT connected to broker');
  mqttClient.subscribe('/1234/', (err) => {
    if (!err) {
      console.log('✅ Subscribed to /1234/');
    }
  });
});

// ✅ MQTT 메시지 → WebSocket 클라이언트로 전달
mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  console.log(`📥 MQTT 수신: [${topic}] ${msg}`);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ topic, msg }));
    }
  });
});

// ✅ WebSocket
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

app.use('/api', sttRoutes(wss, null, mqttClient));
