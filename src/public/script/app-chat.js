const socket = io();

const welcome = document.getElementById('welcome');
const roomForm = welcome.querySelector('form');
const room = document.getElementById('room');

room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector('ul');
  const li = document.createElement('li');
  li.innerText = message;
  ul.appendChild(li);
}

function handleRoomSubmit(event) {
  event.preventDefault();

  const input = roomForm.querySelector('input');
  // Argument와 함께 room이라는 이벤트를 emit
  socket.emit('enter_room', input.value, showRoom);
  roomName = input.value;
  input.value = '';
}

function handleMessageSubmit(event) {
  event.preventDefault();

  const input = room.querySelector('form input');
  const value = input.value;
  socket.emit('new_message', input.value, roomName, () => {
    // 비동기 동작하므로 input.value 사용 불가
    addMessage(`You: ${value}`);
  });
  input.value = '';
}

roomForm.addEventListener('submit', handleRoomSubmit);

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;

  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName}`;
  const messageFrom = room.querySelector('#message');
  messageFrom.addEventListener('submit', handleMessageSubmit);
}

socket.on('welcome_room', (newUser, count) => {
  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName} (${count})`;
  addMessage(`${newUser} arrived!`);
});

socket.on('room_change', (rooms) => {
  console.log(rooms);
  const ul = welcomeForm.querySelector('ul');
  ul.innerText = '';

  rooms.forEach((room) => {
    const li = document.createElement('li');
    li.innerText = room;
    ul.appendChild(li);
  });
});

socket.on('bye_room', (leftUser, count) => {
  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName} (${count})`;
  addMessage(`${leftUser} left ㅠㅠ`);
});

socket.on('new_message', addMessage);
