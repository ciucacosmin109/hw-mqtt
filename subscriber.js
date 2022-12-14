const mqtt = require('mqtt');
const crypto = require ("crypto");

// Crypto
const algorithm = "aes-256-cbc"; 
const aesIv = Buffer.from("1234567890123456")
const key = Buffer.from("12345678901234567890123456789012")

function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(algorithm, key, aesIv);

  let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
  decryptedData += decipher.final("utf-8");
  return decryptedData;
}

// HMAC
const secret = 'ismasero248502349851';
function getHmac(data) {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(data).digest('hex');
}

// MQTT config
const host = 'broker.emqx.io';
const port = '1883';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

// Connect
const connectUrl = `mqtt://${host}:${port}`;
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
});

// Subscribe
const topic = '/nodejs/mqtt-ism-hw';
client.on('connect', () => {
  console.log('Connected');
  client.subscribe([topic], () => {
    console.log(`Subscribed to topic '${topic}'`)
  })
});
client.on('message', (topic, payload) => {
  console.log('');
  
  // decrypt
  let decPayload = "{}"; 
  try {
    decPayload = decrypt(payload.toString());
  }catch{ }

  // parse
  const obj = JSON.parse(decPayload);
  if(!obj.message || !obj.hmac){
    console.log('I have received an invalid message :D');
    return;
  }
  let text = decrypt(obj.message);
  let hmac = getHmac(text);

  // check
  console.log('I have received a message');
  console.log(`-> Received payload (${topic}):`, payload.toString()); 
  console.log(`-> Received message:`, text.toString());
  if(hmac !== obj.hmac){
    console.log('-> WARNING: The message was altered :(');
  } else {
    console.log('-> The message is OK :D');
  }
});