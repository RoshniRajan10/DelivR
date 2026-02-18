const net = require("net");
const readline = require("readline");
const { printAbovePrompt } = require("./display");

const HOST = "localhost";
const PORT = 8080;
const CUSTOMER_ID = process.argv[2] || "C001";

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`👤 Customer ${CUSTOMER_ID} connected`);

  client.write(
    JSON.stringify({
      type: "register",
      role: "customer",
      id: CUSTOMER_ID,
    }) + "\n",
  );
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `💬 You (${CUSTOMER_ID}): `,
});

client.on("data", (data) => {
  const messages = data.toString().trim().split("\n");

  messages.forEach((msg) => {
    try {
      const message = JSON.parse(msg);

      if (message.type === "registered") {
        printAbovePrompt(rl, `✅ ${message.message}`);
        printAbovePrompt(rl, "⏳ Waiting to be paired...\n");
        rl.prompt();
      }

      if (message.type === "paired") {
        printAbovePrompt(rl, `\n🔗 ${message.message}`);
        printAbovePrompt(rl, "💬 Type messages below:\n");
        rl.prompt();
      }

      // ✅ Location updates print ABOVE without disturbing typing
      if (message.type === "location_update") {
        printAbovePrompt(
          rl,
          `📍 DB (${message.deliveryBoyId}) → Lat: ${message.lat}, Lng: ${message.lng}  [${message.timestamp}]`,
        );
      }

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
    } catch (err) {}
  });
});

rl.on("line", (input) => {
  const text = input.trim();
  if (!text) {
    rl.prompt();
    return;
  }

  client.write(
    JSON.stringify({
      type: "message",
      text: text,
    }) + "\n",
  );

  rl.prompt();
});

client.on("end", () => {
  console.log("❌ Disconnected from server");
  process.exit(0);
});

client.on("error", (err) => {
  console.error(`⚠️  Error: ${err.message}`);
  process.exit(1);
});
