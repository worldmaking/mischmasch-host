const WebSocket = require('ws');
const PORT = process.env.PORT || 8082;
const wss = new WebSocket.Server({ port: PORT });
 
wss.on('connection', function connection(ws, req) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    wss.clients.forEach(function(client) {       
        if (client !== ws) {
            try {
                client.send(message);
            } catch (e) {
                console.error(e);
            };
        }
      });
  });
});



