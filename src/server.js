import http from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use('/public', express.static(__dirname + '/public'));

app.get('/chat', (req, res) => res.render('chat'));
app.get('/', (req, res) => res.render('video'));

app.get('/*', (req, res) => res.redirect('/'));

const httpServer = http.createServer(app); // http server
const wsServer = new Server(httpServer);

wsServer.on('connection', (socket) => {
  socket.on('join_room', (roomName, done) => {
    socket.join(roomName);
    socket.to(roomName).emit('welcome_room');
  });

  socket.on('offer', (offer, roomName) => {
    socket.to(roomName).emit('offer', offer);
  });

  socket.on('answer', (answer, roomName) => {
    socket.to(roomName).emit('answer', answer);
  });

  socket.on('ice', (ice, roomName) => {
    socket.to(roomName).emit('ice', ice);
  });
});

httpServer.listen(3000, () => console.log('listening to localhost:3000'));
