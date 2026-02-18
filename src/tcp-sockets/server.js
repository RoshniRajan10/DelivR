const net = require('net');

const HOST = '0.0.0.0';  // ✅ Must be 0.0.0.0 for Railway
const PORT = process.env.PORT || 8080;  // ✅ Railway sets this automatically

const clients = {};
const roles = {};
const pairs = {};

const server = net.createServer((socket) => {
  let clientId = null;
  console.log('🔌 New connection...');

  socket.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString().trim());

      // Register
      if (message.type === 'register') {
        clientId = message.id;
        roles[clientId] = message.role;
        clients[clientId] = socket;
        console.log(`✅ Registered: ${message.role} → ${clientId}`);
        
        socket.write(JSON.stringify({
          type: 'registered',
          message: `You are registered as ${message.role} with ID: ${clientId}`
        }) + '\n');
      }

      // Pair
      if (message.type === 'pair') {
        const { customerId, deliveryBoyId } = message;
        pairs[customerId] = deliveryBoyId;
        console.log(`🔗 Paired: ${customerId} ↔ ${deliveryBoyId}`);

        if (clients[customerId]) {
          clients[customerId].write(JSON.stringify({
            type: 'paired',
            message: `Paired with Delivery Boy: ${deliveryBoyId}`
          }) + '\n');
        }
        if (clients[deliveryBoyId]) {
          clients[deliveryBoyId].write(JSON.stringify({
            type: 'paired',
            message: `Paired with Customer: ${customerId}`
          }) + '\n');
        }
      }

      // Location
      if (message.type === 'location') {
        const customerId = Object.keys(pairs).find(
          (cId) => pairs[cId] === clientId
        );

        if (customerId && clients[customerId]) {
          clients[customerId].write(JSON.stringify({
            type: 'location_update',
            deliveryBoyId: clientId,
            lat: message.lat,
            lng: message.lng,
            timestamp: new Date().toLocaleTimeString()
          }) + '\n');
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
          clients[recipientId].write(JSON.stringify({
            type: 'message',
            from: clientId,
            role: senderRole,
            text: message.text,
            timestamp: new Date().toLocaleTimeString()
          }) + '\n');
        } else {
          socket.write(JSON.stringify({
            type: 'error',
            message: '⚠️ Not paired with anyone!'
          }) + '\n');
        }
      }

    } catch (err) {
      console.error('⚠️  Invalid message');
    }
  });

  socket.on('end', () => {
    if (clientId) {
      console.log(`❌ Disconnected: ${clientId}`);
      delete clients[clientId];
      delete roles[clientId];
      
      Object.keys(pairs).forEach((cId) => {
        if (pairs[cId] === clientId) delete pairs[cId];
      });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 TCP Server running on ${HOST}:${PORT}`);
});