const net = require('net');

const HOST = 'localhost';
const PORT = 8080;

// Change these as needed
const CUSTOMER_ID = process.argv[2] || 'C001';
const DELIVERY_BOY_ID = process.argv[3] || 'DB001';

const client = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`🔗 Pairing Customer ${CUSTOMER_ID} with Delivery Boy ${DELIVERY_BOY_ID}...`);

  client.write(JSON.stringify({
    type: 'pair',
    customerId: CUSTOMER_ID,
    deliveryBoyId: DELIVERY_BOY_ID
  }) + '\n');

  setTimeout(() => {
    client.end();
    console.log(`✅ Paired successfully!`);
  }, 500);
});

client.on('error', (err) => {
  console.error(`⚠️  Error: ${err.message}`);
});