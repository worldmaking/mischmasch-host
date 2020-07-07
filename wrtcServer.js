const createSignalingBroker = require('coven/server');
const DEFAULT_PORT = 8082;
const PORT = +(process.env.PORT || DEFAULT_PORT);
 
createSignalingBroker({
  port: PORT,
  onMessage({ room, type, origin, target }) {
    console.log(`[${room}::${type}] ${origin} -> ${target || '<BROADCAST>'}`);
  },
});