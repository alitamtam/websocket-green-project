// Par défaut la librairie se connecte sur le même serveur qque le serveur HTTP (même domaine et même port)
const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
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

socket.on('server message', (msg) => {
  const row = document.createElement('li');

  const username = document.createElement('span');
  username.textContent = 'La mère Michelle';
  username.classList.add('username');

  const message = document.createElement('span');
  message.textContent = msg;
  message.classList.add('message');

  row.classList.add('server');

  row.appendChild(username);
  row.appendChild(message);
  messages.appendChild(row);

  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('chat message', (msg) => {
  const row = document.createElement('li');

  const username = document.createElement('span');
  username.textContent = msg.user;
  username.classList.add('username');

  const message = document.createElement('span');
  message.textContent = msg.message;
  message.classList.add('message');

  row.appendChild(username);
  row.appendChild(message);
  messages.appendChild(row);

  window.scrollTo(0, document.body.scrollHeight);
});
