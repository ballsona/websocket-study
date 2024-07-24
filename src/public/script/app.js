const socket = new WebSocket(`ws://${window.location.host}`);

const $messageList = document.querySelector('ul');
const $nicknameForm = document.querySelector('form#nickname');
const $messageForm = document.querySelector('form#message');

socket.addEventListener('open', onSocketOpen);
socket.addEventListener('message', onSocketReceiveMessage);
socket.addEventListener('close', onSocketClosed);

$nicknameForm.addEventListener('submit', onSubmitNicknameForm);
$messageForm.addEventListener('submit', onSubmitMessageForm);

//////////////////////////////

function onSocketOpen() {
  console.log('connected to server');
  socket.send('hello server');
}

function onSocketReceiveMessage(messageEvent) {
  const $li = document.createElement('li');
  $li.innerText = messageEvent.data;
  $messageList.append($li);
}

function onSocketClosed(closeEvent) {
  console.log('disconnected to server');
}

function onSubmitNicknameForm(event) {
  event.preventDefault();

  const input = $messageForm.querySelector('input');
  socket.send({
    type: 'nickname',
    payload: input.value,
  });
  input.value = '';
}

function onSubmitMessageForm(event) {
  event.preventDefault();

  const input = $messageForm.querySelector('input');
  socket.send({
    type: 'message',
    payload: input.value,
  });
  input.value = '';
}
