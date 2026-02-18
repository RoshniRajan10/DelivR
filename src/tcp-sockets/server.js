const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8000;

const clients = {};
const roles = {};
const pairs = {};

// Create HTTP server for WebSocket upgrade
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    service: 'TrackMate WebSocket Server',
    connections: Object.keys(clients).length
  }));
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let clientId = null;
  console.log('🔌 New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Register
      if (message.type === 'register') {
        clientId = message.id;
        roles[clientId] = message.role;
        clients[clientId] = ws;
        console.log(`✅ Registered: ${message.role} → ${clientId}`);
        
        ws.send(JSON.stringify({
          type: 'registered',
          message: `Registered as ${message.role} with ID: ${clientId}`
        }));
      }

      // Pair
      if (message.type === 'pair') {
        const { customerId, deliveryBoyId } = message;
        pairs[customerId] = deliveryBoyId;
        console.log(`🔗 Paired: ${customerId} ↔ ${deliveryBoyId}`);

        if (clients[customerId]) {
          clients[customerId].send(JSON.stringify({
            type: 'paired',
            message: `Paired with Delivery Boy: ${deliveryBoyId}`
          }));
        }
        if (clients[deliveryBoyId]) {
          clients[deliveryBoyId].send(JSON.stringify({
            type: 'paired',
            message: `Paired with Customer: ${customerId}`
          }));
        }
      }

      // Location
      if (message.type === 'location') {
        const customerId = Object.keys(pairs).find(
          (cId) => pairs[cId] === clientId
        );

        if (customerId && clients[customerId]) {
          clients[customerId].send(JSON.stringify({
            type: 'location_update',
            deliveryBoyId: clientId,
            lat: message.lat,
            lng: message.lng,
            timestamp: new Date().toLocaleTimeString()
          }));
        }
      }

      // Message
      if (message.type === 'message') {
        const senderRole = roles[clientId];
        let recipientId = null;

        if (senderRole === 'delivery_boy') {
          recipientId = Object.keys(pairs).find(
            (cId) => pairs[cId] === clientId
          );
        } else if (senderRole === 'customer') {
          recipientId = pairs[clientId];
        }

        if (recipientId && clients[recipientId]) {
          clients[recipientId].send(JSON.stringify({
            type: 'message',
            from: clientId,
            role: senderRole,
            text: message.text,
            timestamp: new Date().toLocaleTimeString()
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: '⚠️ Not paired with anyone!'
          }));
        }
      }

    } catch (err) {
      console.error('⚠️  Invalid message:', err.message);
    }
  });

  ws.on('close', () => {
    if (clientId) {
      console.log(`❌ Disconnected: ${clientId}`);
      delete clients[clientId];
      delete roles[clientId];
      
      Object.keys(pairs).forEach((cId) => {
        if (pairs[cId] === clientId) delete pairs[cId];
      });
    }
  });

  ws.on('error', (err) => {
    console.error('⚠️  WebSocket error:', err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket Server running on port ${PORT}`);
});