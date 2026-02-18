const net = require('net');
const readline = require('readline');
const { printAbovePrompt } = require('./display');

const HOST = 'localhost';
const PORT = 8080;
const DELIVERY_BOY_ID = process.argv[2] || 'DB001';

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`🛵 Delivery Boy ${DELIVERY_BOY_ID} connected`);

  client.write(JSON.stringify({
    type: 'register',
    role: 'delivery_boy',
    id: DELIVERY_BOY_ID
  }) + '\n');

  startSendingLocation();
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `💬 You (${DELIVERY_BOY_ID}): `
});

function startSendingLocation() {
  let lat = 12.9716;
  let lng = 77.5946;

  setInterval(() => {
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.5) * 0.001;

    client.write(JSON.stringify({
      type: 'location',
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    }) + '\n');

  }, 1000);
}

client.on('data', (data) => {
  const messages = data.toString().trim().split('\n');

  messages.forEach((msg) => {
    try {
      const message = JSON.parse(msg);

      if (message.type === 'registered') {
        printAbovePrompt(rl, `✅ ${message.message}`);
        printAbovePrompt(rl, '📍 Sending location every second...');
        printAbovePrompt(rl, '💬 Type messages below:\n');
        rl.prompt();
      }

      if (message.type === 'paired') {
        printAbovePrompt(rl, `\n🔗 ${message.message}\n`);
        rl.prompt();
      }

      if (message.type === 'message') {
        printAbovePrompt(rl, `\n📩 Customer (${message.from}): ${message.text}  [${message.timestamp}]`);
        rl.prompt();
      }

      if (message.type === 'error') {
        printAbovePrompt(rl, `\n⚠️  ${message.message}`);
        rl.prompt();
      }

    } catch (err) {}
  });
});

rl.on('line', (input) => {
  const text = input.trim();
  if (!text) {
    rl.prompt();
    return;
  }

  client.write(JSON.stringify({
    type: 'message',
    text: text
  }) + '\n');

  rl.prompt();
});

client.on('end', () => {
  console.log('❌ Disconnected from server');
  process.exit(0);
});

client.on('error', (err) => {
  console.error(`⚠️  Error: ${err.message}`);
  process.exit(1);
});