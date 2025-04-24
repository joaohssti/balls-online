const GRID_SIZE = 50; // Size of each grid cell in pixels
const GRID_COLOR = 'darkgray'; // Light gray grid lines
const GRID_LINE_WIDTH = 1;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const viewport = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height
};
const boundaryColor = '#333';
const boundaryWidth = 50; // Width of the boundary area

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
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
      keys.ArrowUp = true;
      break;
    case 'ArrowDown':
    case 's':
      keys.ArrowDown = true;
      break;
    case 'ArrowLeft':
    case 'a':
      keys.ArrowLeft = true;
      break;
    case 'ArrowRight':
    case 'd':
      keys.ArrowRight = true;
      break;
  }
  updateMovement();
});

window.addEventListener('keyup', (e) => {
  switch(e.key) {
    case 'ArrowUp':
    case 'w':
      keys.ArrowUp = false;
      break;
    case 'ArrowDown':
    case 's':
      keys.ArrowDown = false;
      break;
    case 'ArrowLeft':
    case 'a':
      keys.ArrowLeft = false;
      break;
    case 'ArrowRight':
    case 'd':
      keys.ArrowRight = false;
      break;
  }
  updateMovement();
});

function drawGrid() {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;
  
  // Calculate visible grid area based on viewport
  const startX = Math.floor(viewport.x / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor(viewport.y / GRID_SIZE) * GRID_SIZE;
  
  // Draw vertical lines
  for (let x = startX; x < startX + canvas.width + GRID_SIZE; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x - viewport.x, -viewport.y);
    ctx.lineTo(x - viewport.x, settings.height - viewport.y);
    ctx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = startY; y < startY + canvas.height + GRID_SIZE; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(-viewport.x, y - viewport.y);
    ctx.lineTo(settings.width - viewport.x, y - viewport.y);
    ctx.stroke();
  }
}

// Calculate movement based on keys
function updateMovement() {
  let dx = 0;
  let dy = 0;
  
  if (keys.ArrowRight || keys.d) dx += 1;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  if (keys.ArrowUp || keys.w) dy -= 1;
  
  // Normalize diagonal movement
  if (dx !== 0 || dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
  }
  
  socket.emit('move', { dx, dy });
}

function drawBoundaries() {
  ctx.fillStyle = boundaryColor;
  // Left boundary
  ctx.fillRect(-viewport.x, -viewport.y, boundaryWidth, settings.height);
  // Right boundary
  ctx.fillRect(settings.width - boundaryWidth - viewport.x, -viewport.y, boundaryWidth, settings.height);
  // Top boundary
  ctx.fillRect(-viewport.x, -viewport.y, settings.width, boundaryWidth);
  // Bottom boundary
  ctx.fillRect(-viewport.x, settings.height - boundaryWidth - viewport.y, settings.width, boundaryWidth);
}

function drawPlayers() {
  for (const id in players) {
    const player = players[id];
    ctx.beginPath();
    ctx.arc(
      player.x - viewport.x,
      player.y - viewport.y,
      player.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Draw player ID
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      id.substring(0, 5),
      player.x - viewport.x,
      player.y - viewport.y + player.radius + 15
    );
  }
}

// Game render loop
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update viewport to follow player
  if (myId && players[myId]) {
    const player = players[myId];
    viewport.x = player.x - canvas.width / 2;
    viewport.y = player.y - canvas.height / 2;
    
    // Clamp viewport to world boundaries
    viewport.x = Math.max(0, Math.min(settings.width - canvas.width, viewport.x));
    viewport.y = Math.max(0, Math.min(settings.height - canvas.height, viewport.y));
  }
  
  // Draw grid first (background)
  drawGrid();
  
  // Then draw boundaries (if you're keeping them)
  drawBoundaries();
  
  // Then draw all players
  drawPlayers();
  
  requestAnimationFrame(render);
}

// Start render loop
render();

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});