import WebSocket from 'ws';
console.log('WebSocket.Server:', WebSocket.Server);
const wss = new WebSocket.Server({ noServer: true });
console.log('Instance:', wss);
