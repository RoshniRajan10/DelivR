const net = require("net");
const http = require("http"); // ✅ Add this

const HOST = "0.0.0.0"; // ✅ Must be 0.0.0.0, not localhost
const PORT = process.env.PORT || 8080; // ✅ Use Railway's PORT

const clients = {};
const roles = {};
const pairs = {};

// ✅ CREATE HTTP HEALTH CHECK SERVER
const httpServer = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "TrackMate Socket Server",
        connections: Object.keys(clients).length,
        timestamp: new Date().toISOString(),
      }),
    );
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

httpServer.listen(PORT, HOST, () => {
  console.log(`✅ HTTP Health Server running on ${HOST}:${PORT}`);
});

// ✅ TCP SOCKET SERVER (use different port)
const TCP_PORT = process.env.TCP_PORT || 8081;

const server = net.createServer((socket) => {
  let clientId = null;
  console.log("🔌 New TCP connection...");

  socket.on("data", (data) => {
    try {
      const message = JSON.parse(data.toString().trim());

      // Register client
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
      }

      // Create pair
      if (message.type === "pair") {
        const { customerId, deliveryBoyId } = message;
        pairs[customerId] = deliveryBoyId;
        console.log(
          `🔗 Paired: Customer ${customerId} ↔ Delivery Boy ${deliveryBoyId}`,
        );

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

      // Location update
      if (message.type === "location") {
        const customerId = Object.keys(pairs).find(
          (cId) => pairs[cId] === clientId,
        );

        if (customerId && clients[customerId]) {
          clients[customerId].write(
            JSON.stringify({
              type: "location_update",
              deliveryBoyId: clientId,
              lat: message.lat,
              lng: message.lng,
              timestamp: new Date().toLocaleTimeString(),
            }) + "\n",
          );
        }
      }

      // Chat message
      if (message.type === "message") {
        const senderId = clientId;
        const senderRole = roles[senderId];
        let recipientId = null;

        if (senderRole === "delivery_boy") {
          recipientId = Object.keys(pairs).find(
            (cId) => pairs[cId] === senderId,
          );
        } else if (senderRole === "customer") {
          recipientId = pairs[senderId];
        }

        if (recipientId && clients[recipientId]) {
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

      Object.keys(pairs).forEach((cId) => {
        if (pairs[cId] === clientId) {
          delete pairs[cId];
        }
      });
    }
  });

  socket.on("error", (err) => {
    console.error(`⚠️  Socket error: ${err.message}`);
  });
});

server.listen(TCP_PORT, HOST, () => {
  console.log(`🚀 TCP Socket Server running on ${HOST}:${TCP_PORT}`);
  console.log("Waiting for delivery boys and customers...\n");
});
