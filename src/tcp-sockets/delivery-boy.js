const WebSocket = require('ws');
const readline = require('readline');
const { printAbovePrompt } = require('./display');

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8000';
const DELIVERY_BOY_ID = process.argv[2] || 'DB001';

const ws = new WebSocket(SERVER_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `💬 You (${DELIVERY_BOY_ID}): `
});

ws.on('open', () => {
  console.log(`🛵 Delivery Boy ${DELIVERY_BOY_ID} connected`);

  ws.send(JSON.stringify({
    type: 'register',
    role: 'delivery_boy',
    id: DELIVERY_BOY_ID
  }));

  startSendingLocation();
});

function startSendingLocation() {
  let lat = 12.9716;
  let lng = 77.5946;

  setInterval(() => {
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.5) * 0.001;

    ws.send(JSON.stringify({
      type: 'location',
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    }));
  }, 1000);
}

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);

    if (message.type === 'registered') {
      printAbovePrompt(rl, `✅ ${message.message}`);
      printAbovePrompt(rl, '📍 Sending location every second...\n');
      rl.prompt();
    }

    if (message.type === 'paired') {
      printAbovePrompt(rl, `🔗 ${message.message}\n`);
      rl.prompt();
    }

    if (message.type === 'message') {
      printAbovePrompt(rl, `\n📩 Customer: ${message.text}  [${message.timestamp}]`);
      rl.prompt();
    }
  } catch (err) {}
});

rl.on('line', (input) => {
  const text = input.trim();
  if (!text) {
    rl.prompt();
    return;
  }

  ws.send(JSON.stringify({
    type: 'message',
    text: text
  }));

  rl.prompt();
});

ws.on('close', () => {
  console.log('❌ Disconnected');
  process.exit(0);
});