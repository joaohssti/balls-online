const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Game state
const players = {};
const settings = {
  width: 2000,
  height: 2000,
  boundaryWidth: 50 // Match client boundary width
};

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  players[socket.id] = {
    x: Math.random() * settings.width,
    y: Math.random() * settings.height,
    radius: 25,
    color: getRandomColor(),
    speed: 5,
    dx: 0,
    dy: 0
  };
  
  socket.emit('init', { 
    playerId: socket.id, 
    settings, 
    players 
  });
  
  socket.broadcast.emit('newPlayer', { 
    id: socket.id, 
    player: players[socket.id] 
  });
  
  socket.on('move', (data) => {
    const player = players[socket.id];
    if (player) {
      player.dx = data.dx;
      player.dy = data.dy;
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

function update() {
  for (const id in players) {
    const player = players[id];
    // Calculate new position with boundaries
    player.x = Math.max(
      player.radius + settings.boundaryWidth,
      Math.min(
        settings.width - player.radius - settings.boundaryWidth,
        player.x + player.dx * player.speed
      )
    );
    player.y = Math.max(
      player.radius + settings.boundaryWidth,
      Math.min(
        settings.height - player.radius - settings.boundaryWidth,
        player.y + player.dy * player.speed
      )
    );
  }
  io.emit('update', players);
}

setInterval(update, 1000 / 60);

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '10.1.1.139', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Local network access: http://${getLocalIpAddress()}:${PORT}`);
    console.log(`Static files being served from: ${path.join(__dirname, 'public')}`);
  });
  
  // Add this helper function (place it with your other functions):
  function getLocalIpAddress() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
}