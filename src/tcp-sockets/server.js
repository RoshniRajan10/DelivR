const net = require("net");

const HOST = "localhost";
const PORT = 8080;

// Store all connected clients
const clients = {}; // { id: socket }
const roles = {}; // { id: 'delivery_boy' | 'customer' }

// Pairing map
const pairs = {}; // { customerId: deliveryBoyId }

const server = net.createServer((socket) => {
  let clientId = null;

  console.log("🔌 New connection...");

  socket.on("data", (data) => {
    try {
      const message = JSON.parse(data.toString().trim());

      // 1. Register client
      if (message.type === "register") {
        clientId = message.id;
        roles[clientId] = message.role;
        clients[clientId] = socket;

        console.log(`✅ Registered: ${message.role} → ${clientId}`);
        socket.write(
          JSON.stringify({
            type: "registered",
            message: `You are registered as ${message.role} with ID: ${clientId}`,
          }) + "\n",
        );

        // Show current connections
        printConnections();
      }

      // 2. Create a pair (can be sent from server console or admin)
      if (message.type === "pair") {
        const { customerId, deliveryBoyId } = message;
        pairs[customerId] = deliveryBoyId;
        console.log(
          `🔗 Paired: Customer ${customerId} ↔ Delivery Boy ${deliveryBoyId}`,
        );

        // Notify both
        if (clients[customerId]) {
          clients[customerId].write(
            JSON.stringify({
              type: "paired",
              message: `You are paired with Delivery Boy: ${deliveryBoyId}`,
            }) + "\n",
          );
        }
        if (clients[deliveryBoyId]) {
          clients[deliveryBoyId].write(
            JSON.stringify({
              type: "paired",
              message: `You are paired with Customer: ${customerId}`,
            }) + "\n",
          );
        }
      }

      // 3. Delivery boy sends location
      if (message.type === "location") {
        // Find which customer is paired with this delivery boy
        const customerId = Object.keys(pairs).find(
          (cId) => pairs[cId] === clientId,
        );

        if (customerId && clients[customerId]) {
          // Forward location to paired customer
          clients[customerId].write(
            JSON.stringify({
              type: "location_update",
              deliveryBoyId: clientId,
              lat: message.lat,
              lng: message.lng,
              timestamp: new Date().toLocaleTimeString(),
            }) + "\n",
          );

          console.log(
            `📍 ${clientId} → ${customerId} | Lat: ${message.lat}, Lng: ${message.lng}`,
          );
        }
      }

      // 4. Handle chat messages
      if (message.type === "message") {
        const senderId = clientId;
        const senderRole = roles[senderId];
        let recipientId = null;

        // Find the paired recipient
        if (senderRole === "delivery_boy") {
          // Delivery boy → find their paired customer
          recipientId = Object.keys(pairs).find(
            (cId) => pairs[cId] === senderId,
          );
        } else if (senderRole === "customer") {
          // Customer → find their paired delivery boy
          recipientId = pairs[senderId];
        }

        if (recipientId && clients[recipientId]) {
          // Forward message to paired person
          clients[recipientId].write(
            JSON.stringify({
              type: "message",
              from: senderId,
              role: senderRole,
              text: message.text,
              timestamp: new Date().toLocaleTimeString(),
            }) + "\n",
          );

          console.log(
            `💬 Message: ${senderId} → ${recipientId}: ${message.text}`,
          );
        } else {
          // No pair found
          socket.write(
            JSON.stringify({
              type: "error",
              message: "⚠️ You are not paired with anyone yet!",
            }) + "\n",
          );
        }
      }
    } catch (err) {
      console.error("⚠️  Invalid message format");
    }
  });

  socket.on("end", () => {
    if (clientId) {
      console.log(`❌ Disconnected: ${roles[clientId]} → ${clientId}`);
      delete clients[clientId];
      delete roles[clientId];

      // Remove pair if delivery boy disconnects
      Object.keys(pairs).forEach((cId) => {
        if (pairs[cId] === clientId) {
          delete pairs[cId];
          console.log(`🔓 Pair removed for customer: ${cId}`);
        }
      });
    }
  });

  socket.on("error", (err) => {
    console.error(`⚠️  Error: ${err.message}`);
  });
});

function printConnections() {
  console.log("\n📋 Current Connections:");
  Object.keys(clients).forEach((id) => {
    console.log(`   ${roles[id]} → ${id}`);
  });
  console.log("");
}

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log("Waiting for delivery boys and customers...\n");
});
