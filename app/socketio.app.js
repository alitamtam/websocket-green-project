/* eslint-disable no-param-reassign */
import debug from 'debug';

const debugCommand = debug('app:command:');
const debugCnx = debug('app:cnx:');
const debugInfo = debug('app:info:');

// On initalise une sorte de BDD (collection) qui permettra d'avoir la connaissance globale de tous les utilisateurs connecté
const users = [];
const MAIN_ROOM = 'Général';

function sendRoomStats(io, room = MAIN_ROOM) {
  const mainRoomCount = users.filter((connectedUser) => connectedUser.room === room).length;
  io.to(room).emit('server message', { timestamp: new Date().toISOString(), message: `${mainRoomCount} utilisateur(s) connecté(s) sur le canal "${room}"` });
}

function switchRoom(io, socket, user, oldRoom, newRoom) {
  if (oldRoom === newRoom) {
    socket.emit('server message', { message: `Vous êtes déjà dans le canal ${newRoom}` });
    return;
  }
  if (!newRoom && oldRoom === MAIN_ROOM) {
    socket.emit('server message', { message: `Vous ne pouvez pas quitter le canal ${MAIN_ROOM}` });
    return;
  }
  if (!newRoom) {
    newRoom = MAIN_ROOM;
  }
  // Quitter le canal courant
  socket.leave(oldRoom);
  // Moidifé l'information du canal sur l'objet d'"état" de l'utilisateur courant
  user.room = newRoom;
  // On envoi les nouvelles stats aux utilisateurs de l'ancien canal
  sendRoomStats(io, oldRoom);
  // On se connecte au nouveau
  socket.join(newRoom);
  // On vide l'historique des messages de l'ancien canal
  socket.emit('empty chat');
  // on déclenche l'évéenement de changement de nom de canl dans la barre de message
  socket.emit('room join', newRoom);
  // On envoi un message à l'utilsateur courant de bienvenue dans le nouveau canal
  socket.emit('server message', { message: `Bienvenue dans le canal ${newRoom}` });
  // On envoi les stats de ce canal à tous leurs utilisateurs
  sendRoomStats(io, newRoom);
}

/* eslint-disable no-param-reassign */
function command(io, socket, user, msg) {
  debugCommand(`command: ${msg}`);
  const [type, value] = msg.split(' ');
  switch (type) {
    case '/pseudo':
      socket.emit('server message', { message: `Votre pseudo est maintenant : ${value}` });
      socket.broadcast.emit('server message', { message: `${user.name} s'appelle maintenant ${value}` });
      user.name = value;
      break;
    case '/join':
      switchRoom(io, socket, user, user.room, value);
      break;
    case '/quit':
      switchRoom(io, socket, user, user.room);
      break;
    default:
      socket.emit('server message', { message: 'Commande inconnue' });
      break;
  }
}

export default (io) => {
  // .on est l'équivalent de .addEventListener du côté client, en l'occurance socket.io côté client implémente la même méthode pour des raisons de cohérence, mais c'est le m^peme principe
  // C'est un écouteur d'événement : ici l'évenement que l'on écoute intervient lorsquer un utilisateur se connecte au server websocket
  // io = server complet = tout les utilisateurs
  io.on('connection', (socket) => {
    socket.join('Général');
    socket.emit('room join', 'Général');
    const user = {
      name: socket.id,
      room: MAIN_ROOM,
    };

    // On ajoute l'utilisateur qui vient de se connecter à la collection
    users.push(user);

    // ici on est dans le contexte d'un utilisateur connecté
    debugCnx(`user connected (${socket.id})`);
    socket.broadcast.emit('server message', { message: `${user.name} vient de se connecter` });

    // on peut émettre un évenement vers l'utilisateur courant uniquement : socket.emit()
    socket.emit('empty chat');
    socket.emit('server message', { timestamp: new Date().toISOString(), message: 'Bienvenue sur le chat "de la mère Michelle"' });
    sendRoomStats(io);

    // socket = contexte courant = un utilisateur connecté
    // a partir de là on va pouvoir écouté des évement de cet utilisateur en particulier
    // à travers la viariable socket et non io
    socket.on('disconnect', () => {
      // On supprime l'utilisateur courant de la collection globale
      users.splice(users.indexOf(user), 1);
      socket.broadcast.emit('server message', { message: `${user.name} vient de se déconnecter` });
      debugCnx(`${user.name} deconnected`);
    });
    // on pêut également écouter un evénement personnalisé, "chat message" c'est le nom de l'évenement qui a été envoyé du coté du navigateur
    // C'est la fonction de callback qui va récupérer les données envoyé par l'emission d'événement de l'autre côté
    socket.on('chat message', (msg) => {
      if (msg.slice(0, 1) === '/') {
        command(io, socket, user, msg);
        return;
      }

      debugInfo(`message: ${msg}`);
      // Maintenant il faut renvoyer le message de cet utilisateur à tous les autres utilisateurs
      // On va faire ce que l'on appelle du broadcasting
      // On parle à tout le monde sauf a l'utilsateur courant (socket)
      // socket.broadcast.emit('chat message', { user: socket.id, message: msg });
      // On peut également envoyer le message a TOUT le monde (inclus l'envoyeur) afin que l'envoyeur voit également son propre message. (on aurait pu le gérer en local également)
      console.log(user.room);
      io.to(user.room).emit('chat message', { user: user.name, message: msg, timestamp: new Date().toISOString() });
    });
  });
};
