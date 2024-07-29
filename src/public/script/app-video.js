const socket = io();

const myFace = document.getElementById('myFace');
const muteButton = document.getElementById('mute');
const cameraButton = document.getElementById('camera');
const cameraSelect = document.getElementById('cameras');

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');
const call = document.getElementById('call');

const peerFace = document.getElementById('peerFace');

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia(); // settings
  makeConnection(); // 다른 접속자와의 연결
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();

  await initCall();
  const input = welcomeForm.querySelector('input');
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
}

async function getCameraDevices() {
  try {
    // 접근 가능한 출력 장치 모두 반환
    const devices = await navigator.mediaDevices.enumerateDevices();

    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks();

    cameras.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      cameraSelect.appendChild(option);

      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: deviceId ? { facingMode: 'user' } : { deviceId: { exact: deviceId } },
    });
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameraDevices();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  muteButton.innerText = muted ? 'UnMute' : 'Mute';
  muted = !muted;
}

function handleCameraClick() {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  cameraButton.innerText = cameraOff ? 'Turn Camera Off' : 'Turn Camera On';
  cameraOff = !cameraOff;
}

async function handleCameraChange() {
  await getMedia(cameraSelect.value); // device id

  // peer에게 보내는 video track도 교체해줘야함
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    // sender는 peer에게 보내진 video, audio 데이터를 컨트롤
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack);
  }
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit);
muteButton.addEventListener('click', handleMuteClick);
cameraButton.addEventListener('click', handleCameraClick);
cameraSelect.addEventListener('input', handleCameraChange);

/** socket code  */

socket.on('welcome_room', async () => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, roomName);
});

socket.on('offer', async (offer) => {
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
});

socket.on('answer', (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on('ice', (ice) => {
  myPeerConnection.addIceCandidate(ice);
  console.log('receive ice candidate');
});

/** RTC code  */

function makeConnection() {
  // peer to peer connection 생성
  myPeerConnection = new RTCPeerConnection();
  // Ice Candidate
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('addstream', handleAddStream);
  // 카메라와 마이크 strema을 해당 connection에 넣어
  myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  socket.emit('ice', data.candidate, roomName);
  console.log('send ice candidate');
}

function handleAddStream(data) {
  peerFace.srcObject = data.stream;
}

///////////////////////////////////

// ice-candidate -> 각 브라우저에서 생성하는 candidate를 서로 전달하면서 소통하는 방식

// localtunnel -> localhost 빠르게 배포 가능한 패키지
// STUN server -> 장치의 공용 ip 찾아주는 서버

// data channel -> 데이터 주고 받을 수 있음. -> Mess
// SFU
