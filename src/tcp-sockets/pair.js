require("dotenv").config();

const WebSocket = require("ws");

const SERVER_URL = process.env.SERVER_URL || "ws://localhost:8000";

// Change these as needed
const CUSTOMER_ID = process.argv[2] || "C001";
const DELIVERY_BOY_ID = process.argv[3] || "DB001";

console.log(`🔗 Connecting to: ${SERVER_URL}`);
console.log(
  `🔗 Pairing Customer ${CUSTOMER_ID} with Delivery Boy ${DELIVERY_BOY_ID}...`,
);

const ws = new WebSocket(SERVER_URL);

ws.on("open", () => {
  // Send pairing request
  ws.send(
    JSON.stringify({
      type: "pair",
      customerId: CUSTOMER_ID,
      deliveryBoyId: DELIVERY_BOY_ID,
    }),
  );

  console.log(`✅ Paired successfully!`);

  // Close connection after a short delay
  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 500);
});

ws.on("error", (err) => {
  console.error(`⚠️  Error: ${err.message}`);
  console.error(`\n🔍 Make sure:`);
  console.error(`   1. Server is running`);
  console.error(`   2. SERVER_URL is correct: ${SERVER_URL}`);
  console.error(`   3. Using ws:// for local or wss:// for deployed\n`);
  process.exit(1);
});

ws.on("close", () => {
  console.log("👋 Connection closed");
});
