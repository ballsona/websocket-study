import http from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use('/public', express.static(__dirname + '/public'));

app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const httpServer = http.createServer(app); // http server
const wsServer = new Server(httpServer, {
  cors: {
    origin: ['https://admin.socket.io'], // admin panel
    credentials: true,
  },
});

instrument(wsServer, {
  auth: false,
});

wsServer.on('connection', (socket) => {
  socket['nickname'] = 'Anoynous';

  socket.onAny((event) => {
    console.log(event);
  });

  socket.on('enter_room', (roomName, done) => {
    socket.join(roomName);
    done(); // emit('enter_room', ...)의 마지막 인자에 담긴 함수를 실행

    socket.to(roomName).emit('welcome_room', socket.nickname, getRoomCounts(roomName));
    wsServer.sockets.emit('room_change', getPublicRooms());
  });

  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  });

  socket.on('nickname', (nickname) => {
    socket['nickname'] = nickname;
  });

  // 연결 끊기기 직전 => 아직 room 정보 살아있음
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit('bye_room', socket.nickname, getRoomCounts(room) - 1);
    });
  });

  // 연결 완전히 끊김
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', getPublicRooms());
  });
});

httpServer.listen(3000, () => console.log('listening to localhost:3000'));

///////////////////////////////////////

function getRoomCounts(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

function getPublicRooms() {
  // sids: 모든 socket에 대한 정보
  // rooms: 모든 방에 대한 정보
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];

  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}
