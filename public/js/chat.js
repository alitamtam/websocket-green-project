// Par défaut la librairie se connecte sur le même serveur qque le serveur HTTP (même domaine et même port)
const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const room = document.getElementById('room');
const messages = document.getElementById('messages');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('empty chat', () => {
  messages.textContent = '';
});
socket.on('room join', (roomName) => {
  room.textContent = roomName;
});

function generateChatRow(msg, sender = 'user') {
  let { user } = msg;
  const { timestamp, message } = msg;

  const row = document.createElement('li');

  if (sender === 'server') {
    user = 'La mère Michelle';
    row.classList.add('server');
  }
  const timestampSpan = document.createElement('span');
  timestampSpan.textContent = dayjs(timestamp).locale('fr').format('HH:mm');
  timestampSpan.classList.add('timestamp');

  const usernameSpan = document.createElement('span');
  usernameSpan.textContent = user;
  usernameSpan.classList.add('username');

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  messageSpan.classList.add('message');

  row.appendChild(timestampSpan);
  row.appendChild(usernameSpan);
  row.appendChild(messageSpan);

  return row;
}

socket.on('server message', (msg) => {
  const row = generateChatRow(msg, 'server');
  messages.appendChild(row);

  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('chat message', (msg) => {
  const row = generateChatRow(msg);
  messages.appendChild(row);

  window.scrollTo(0, document.body.scrollHeight);
});
