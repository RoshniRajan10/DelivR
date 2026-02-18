require("dotenv").config();

const WebSocket = require("ws");
const readline = require("readline");
const { printAbovePrompt } = require("./display");

// ✅ Change this to your deployed Render URL
const SERVER_URL = process.env.SERVER_URL || "ws://localhost:8000";
const CUSTOMER_ID = process.argv[2] || "C001";

console.log(`🔗 Connecting to: ${SERVER_URL}`);

const ws = new WebSocket(SERVER_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `💬 You (${CUSTOMER_ID}): `,
});

ws.on("open", () => {
  console.log(`👤 Customer ${CUSTOMER_ID} connected`);

  // Register as customer
  ws.send(
    JSON.stringify({
      type: "register",
      role: "customer",
      id: CUSTOMER_ID,
    }),
  );
});

ws.on("message", (data) => {
  try {
    const message = JSON.parse(data);

    if (message.type === "registered") {
      printAbovePrompt(rl, `✅ ${message.message}`);
      printAbovePrompt(rl, "⏳ Waiting to be paired with a delivery boy...\n");
      rl.prompt();
    }

    if (message.type === "paired") {
      printAbovePrompt(rl, `\n🔗 ${message.message}`);
      printAbovePrompt(
        rl,
        "💬 You can now type messages to your delivery boy:\n",
      );
      rl.prompt();
    }

    // Receive live location
    if (message.type === "location_update") {
      printAbovePrompt(
        rl,
        `📍 DB (${message.deliveryBoyId}) → Lat: ${message.lat}, Lng: ${message.lng}  [${message.timestamp}]`,
      );
    }

    // Receive message from delivery boy
    if (message.type === "message") {
      printAbovePrompt(
        rl,
        `\n📩 Delivery Boy (${message.from}): ${message.text}  [${message.timestamp}]`,
      );
      rl.prompt();
    }

    if (message.type === "error") {
      printAbovePrompt(rl, `\n⚠️  ${message.message}`);
      rl.prompt();
    }
  } catch (err) {
    console.error("Parse error:", err.message);
  }
});

// Send typed message to paired delivery boy
rl.on("line", (input) => {
  const text = input.trim();
  if (!text) {
    rl.prompt();
    return;
  }

  ws.send(
    JSON.stringify({
      type: "message",
      text: text,
    }),
  );

  rl.prompt();
});

ws.on("close", () => {
  console.log("❌ Disconnected from server");
  process.exit(0);
});

ws.on("error", (err) => {
  console.error(`⚠️  Connection error: ${err.message}`);
  console.error(`\n🔍 Make sure:`);
  console.error(`   1. Server is running`);
  console.error(`   2. SERVER_URL is correct: ${SERVER_URL}`);
  console.error(`   3. Using ws:// for local or wss:// for deployed\n`);
  process.exit(1);
});
