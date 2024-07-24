import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

// 하나의 서버가 http protocol, wss protocol 지원
const server = http.createServer(app); // http server
const wss = new WebSocketServer({ server }); // web socket server

wss.on('connection', (socket) => {
  console.log('connected to client');

  socket.on('close', () => console.log('disconnected to client'));
  socket.on('message', (message, isBinary) => {
    //console.log(JSON.stringify(message), isBinary);
    wss.clients.forEach((clientSocket) => {
      clientSocket.send(message, { binary: isBinary });
    });
  });
});

server.listen(3000, () => console.log('listening to localhost:3000'));
