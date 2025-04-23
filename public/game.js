const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
let players = {};
let myId = null;
let settings = {};
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// Connect to server
const socket = io();

// Handle initialization
socket.on('init', (data) => {
  myId = data.playerId;
  settings = data.settings;
  players = data.players;
});

// Handle new players
socket.on('newPlayer', (data) => {
  players[data.id] = data.player;
});

// Handle player disconnections
socket.on('playerDisconnected', (id) => {
  delete players[id];
});

// Handle game updates
socket.on('update', (updatedPlayers) => {
  players = updatedPlayers;
});

// Keyboard input
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
    updateMovement();
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
    updateMovement();
  }
});

// Calculate movement based on keys
function updateMovement() {
  const dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
  const dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  
  // Normalize diagonal movement
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length > 0) {
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    socket.emit('move', { dx: normalizedDx, dy: normalizedDy });
  } else {
    socket.emit('move', { dx: 0, dy: 0 });
  }
}

// Game render loop
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw all players
  for (const id in players) {
    const player = players[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Draw player ID
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(id.substring(0, 5), player.x, player.y + player.radius + 15);
  }
  
  requestAnimationFrame(render);
}

// Start render loop
render();

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});