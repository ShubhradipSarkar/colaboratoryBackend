const http = require('http');
const { WebSocketServer } = require('ws');
const url = require('url');
const uuidv4 = require('uuid').v4;

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const PORT = 8000;

const connections = {}; // Changed from 'connection' to 'connections'

const users = {};

const broadcast = () => {
  Object.keys(connections).forEach(uuid => {
    const connect = connections[uuid];
    const message = JSON.stringify(users);
    connect.send(message, error => {
      if (error) {
        console.error('Error broadcasting message:', error);
      }
    });
  });
};

const handleMessage = (data, uuid) => { // Changed 'bytes' to 'data'
  const message = JSON.parse(data.toString()); // Parse the received data
  const user = users[uuid];
  user.state.line.push(message); // Push the parsed message into user's state
  broadcast();
  console.log(user.state.line);
};

const handleClose = (uuid) => {
  delete connections[uuid]; // Fix deletion of connection
  delete users[uuid];
  broadcast();
};

wsServer.on('connection', (connection, request) => {
  const { username } = url.parse(request.url, true).query; // Destructure username directly
  const uuid = uuidv4();
  console.log(uuid);
  console.log(username);

  connections[uuid] = connection; // Store the connection using UUID as key

  users[uuid] = {
    id: uuid,
    username: username,
    state: {
      line: [],
    },
  };

  connection.on('message', message => handleMessage(message, uuid)); // Changed 'bytes' to 'message'
  connection.on('close', () => handleClose(uuid));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
