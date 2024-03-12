import debug from 'debug';

const debugCommand = debug('app:command:');
const debugCnx = debug('app:cnx:');
const debugInfo = debug('app:info:');

/* eslint-disable no-param-reassign */
function command(socket, user, msg) {
  debugCommand(`command: ${msg}`);
  const [type, value] = msg.split(' ');
  switch (type) {
    case '/pseudo':
      socket.emit('server message', `Votre pseudo est maintenant : ${value}`);
      socket.broadcast.emit('server message', `${user.name} s'appelle maintenant ${value}`);
      user.name = value;
      break;
    default:
      io.emit('server message', 'Commande inconnue');
      break;
  }
}

export default (io) => {
  // .on est l'équivalent de .addEventListener du côté client, en l'occurance socket.io côté client implémente la même méthode pour des raisons de cohérence, mais c'est le m^peme principe
  // C'est un écouteur d'événement : ici l'évenement que l'on écoute intervient lorsquer un utilisateur se connecte au server websocket
  // io = server complet = tout les utilisateurs
  io.on('connection', (socket) => {
    let now = new Date().toISOString();

    const user = {
      name: socket.id,
    };
    // ici on est dans le contexte d'un utilisateur connecté
    debugCnx(`user connected (${socket.id})`);

    // on peut émettre un évenement vers l'utilisateur courant uniquement : socket.emit()
    socket.emit('empty chat');
    socket.emit('server message', { timestamp: now, message: 'Bienvenue sur le chat "de la mère Michelle"' });

    // socket = contexte courant = un utilisateur connecté
    // a partir de là on va pouvoir écouté des évement de cet utilisateur en particulier
    // à travers la viariable socket et non io
    socket.on('disconnect', () => {
      debugCnx(`${user.name} deconnected`);
    });
    // on pêut également écouter un evénement personnalisé, "chat message" c'est le nom de l'évenement qui a été envoyé du coté du navigateur
    // C'est la fonction de callback qui va récupérer les données envoyé par l'emission d'événement de l'autre côté
    socket.on('chat message', (msg) => {
      now = new Date().toISOString();

      if (msg.slice(0, 1) === '/') {
        command(socket, user, msg);
        return;
      }

      debugInfo(`message: ${msg}`);
      // Maintenant il faut renvoyer le message de cet utilisateur à tous les autres utilisateurs
      // On va faire ce que l'on appelle du broadcasting
      // On parle à tout le monde sauf a l'utilsateur courant (socket)
      // socket.broadcast.emit('chat message', { user: socket.id, message: msg });
      // On peut également envoyer le message a TOUT le monde (inclus l'envoyeur) afin que l'envoyeur voit également son propre message. (on aurait pu le gérer en local également)
      io.emit('chat message', { user: user.name, message: msg, timestamp: now });
    });
  });
};
