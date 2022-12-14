const mqtt = require('mqtt');
const crypto = require ("crypto");

// Crypto
const algorithm = "aes-256-cbc"; 
const aesIv = Buffer.from("1234567890123456")
const key = Buffer.from("12345678901234567890123456789012")

function encrypt(data) {
  const cipher = crypto.createCipheriv(algorithm, key, aesIv);

  let encryptedData = cipher.update(data, "utf-8", "hex");
  encryptedData += cipher.final("hex");
  return encryptedData
}

// HMAC
const secret = 'ismasero248502349851';
function getHmac(data) {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(data).digest('hex');
}

// MQTT
const host = 'broker.emqx.io';
const port = '1883';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

// connect
const connectUrl = `mqtt://${host}:${port}`;
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
});

// Send the message
const messageToSend = "Secret message";
function getPayload(msg) {
  let cipherText = encrypt(msg);
  let hmac = getHmac(msg);

  return {
    message: cipherText,
    hmac: hmac
  }
}

const topic = '/nodejs/mqtt-ism-hw';
client.on('connect', () => {
  console.log('Connected');

  const payload = JSON.stringify(getPayload(messageToSend));
  const encPayload = encrypt(payload);

  const pub = () => {
    client.publish(
      topic, 
      encPayload, 

      { qos: 0, retain: false }, 

      (error) => {
        console.log();

        if (error) {
          console.error(error);
        }else{
          console.log("Sent message:", messageToSend);
          console.log("Sent payload:", encPayload);
        }
      }
    );
  }
  setInterval(pub, 2000);

});