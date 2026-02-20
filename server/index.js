const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const TOPICS = require('./game_content');

const app = express();
app.use(cors());

// Serve static files from the React app (if built)
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (development)
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// --- Game State (In-Memory) ---
let gameState = {
  players: {}, // socketId -> { id, name, team, isHost, isBachelor }
  teams: {},   // teamName -> { score, members: [], guess: null }
  currentPhase: 'LOBBY', // LOBBY, BACHELOR_TURN, TEAM_GUESS, REVEAL
  bachelorId: null,
  currentTopic: null, // { left: "", right: "" } or "Statement"
  targetPosition: null, // 0-100
  gameMode: 'CONCEPTS', // 'CONCEPTS' or 'AGREE_DISAGREE'
};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send initial state
  socket.emit('state_update', gameState);

  // --- Event Handlers ---

  socket.on('join_game', ({ name, isHost }) => {
    // If name is "Bachelor" (case insensitive), mark them as the Bachelor automatically?
    // Or just let the Host assign. For now, let's keep it simple.
    // Maybe the Host is a special role that controls the game flow.

    gameState.players[socket.id] = {
      id: socket.id,
      name: name,
      team: null,
      isHost: isHost || false,
      isBachelor: false // Will be set later
    };

    io.emit('state_update', gameState);
  });

  socket.on('create_team', ({ teamName }) => {
    if (!gameState.teams[teamName]) {
      gameState.teams[teamName] = {
        score: 0,
        members: [],
        guess: null
      };
    }
    // Automatically join the creator to the team
    joinTeam(socket.id, teamName);
    io.emit('state_update', gameState);
  });

  socket.on('join_team', ({ teamName }) => {
    joinTeam(socket.id, teamName);
    io.emit('state_update', gameState);
  });

  socket.on('set_bachelor', ({ playerId }) => {
    // Reset previous bachelor if any
    if (gameState.bachelorId && gameState.players[gameState.bachelorId]) {
      gameState.players[gameState.bachelorId].isBachelor = false;
    }
    gameState.bachelorId = playerId;
    if (gameState.players[playerId]) {
      gameState.players[playerId].isBachelor = true;
    }
    io.emit('state_update', gameState);
  });

  socket.on('start_game', () => {
    if (gameState.currentPhase === 'LOBBY') {
      // Basic check: do we have a bachelor?
      if (!gameState.bachelorId) {
        const playerIds = Object.keys(gameState.players).filter(id => !gameState.players[id].isHost);
        if (playerIds.length > 0) {
            const randomId = playerIds[0];
            gameState.bachelorId = randomId;
            gameState.players[randomId].isBachelor = true;
        }
      }

      startNewRound();
    }
  });

  socket.on('bachelor_guess', ({ position }) => {
    // Only allow if it is Bachelor's turn and sender is Bachelor
    if (gameState.currentPhase === 'BACHELOR_TURN' && socket.id === gameState.bachelorId) {
      gameState.targetPosition = position;
      gameState.currentPhase = 'TEAM_GUESS';
      io.emit('state_update', gameState);
    }
  });

  socket.on('submit_guess', ({ position }) => {
    if (gameState.currentPhase !== 'TEAM_GUESS') return;

    const player = gameState.players[socket.id];
    if (!player || !player.team || player.isBachelor) return;

    // Store player's guess
    player.guess = position;
    player.hasGuessed = true;

    // Update Team Average
    const team = gameState.teams[player.team];
    const members = team.members.map(mid => gameState.players[mid]);
    const guessingMembers = members.filter(m => m.hasGuessed);

    if (guessingMembers.length > 0) {
        const total = guessingMembers.reduce((sum, m) => sum + m.guess, 0);
        team.guess = Math.round(total / guessingMembers.length);
    }

    // Check if ALL teams have finished guessing
    // A team is finished if all its non-bachelor members have guessed.
    // Actually, let's just check if ALL non-bachelor players in the game have guessed.
    const allPlayers = Object.values(gameState.players);
    const guessers = allPlayers.filter(p => !p.isHost && !p.isBachelor);
    const allGuessed = guessers.every(p => p.hasGuessed);

    if (allGuessed && guessers.length > 0) {
        // Calculate scores and reveal!
        calculateScores();
        gameState.currentPhase = 'REVEAL';
    }

    io.emit('state_update', gameState);
  });

  socket.on('next_round', () => {
    // Only host or bachelor can trigger next round?
    // Let's allow host for now.
    if (gameState.players[socket.id]?.isHost) {
        startNewRound();
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (gameState.players[socket.id]) {
      const { team } = gameState.players[socket.id];

      // Remove from team members list
      if (team && gameState.teams[team]) {
        gameState.teams[team].members = gameState.teams[team].members.filter(id => id !== socket.id);
        // If team is empty, delete it? Maybe keep it for history.
        if (gameState.teams[team].members.length === 0) {
           delete gameState.teams[team];
        }
      }

      delete gameState.players[socket.id];

      if (gameState.bachelorId === socket.id) {
        gameState.bachelorId = null; // Game might need a reset or new bachelor
      }

      io.emit('state_update', gameState);
    }
  });
});

function startNewRound() {
  gameState.currentPhase = 'BACHELOR_TURN';
  gameState.targetPosition = null;

  // Reset guesses
  Object.values(gameState.players).forEach(p => {
      p.guess = null;
      p.hasGuessed = false;
  });

  Object.keys(gameState.teams).forEach(tName => {
    gameState.teams[tName].guess = null;
  });

  // Pick random topic
  // Game Mode Logic: Alternate or Random? Let's just pick randomly for now.
  // We have TOPICS.concepts (array of [left, right]) and TOPICS.statements (array of strings)

  const mode = Math.random() > 0.5 ? 'CONCEPTS' : 'AGREE_DISAGREE';
  gameState.gameMode = mode;

  if (mode === 'CONCEPTS') {
    const concepts = TOPICS.concepts;
    const randomPair = concepts[Math.floor(Math.random() * concepts.length)];
    gameState.currentTopic = { left: randomPair[0], right: randomPair[1] };
  } else {
    const statements = TOPICS.statements;
    const randomStatement = statements[Math.floor(Math.random() * statements.length)];
    gameState.currentTopic = randomStatement;
  }

  io.emit('state_update', gameState);
}

function joinTeam(socketId, teamName) {
  const player = gameState.players[socketId];
  if (!player) return;

  // Leave previous team
  if (player.team && gameState.teams[player.team]) {
    gameState.teams[player.team].members = gameState.teams[player.team].members.filter(id => id !== socketId);
     if (gameState.teams[player.team].members.length === 0) {
        delete gameState.teams[player.team];
     }
  }

  // Join new team
  player.team = teamName;
  if (!gameState.teams[teamName]) {
     gameState.teams[teamName] = { score: 0, members: [], guess: null };
  }
  gameState.teams[teamName].members.push(socketId);
}

function calculateScores() {
  const target = gameState.targetPosition;

  Object.keys(gameState.teams).forEach(tName => {
    const team = gameState.teams[tName];
    if (team.guess !== null) {
      const diff = Math.abs(team.guess - target);
      let points = 0;

      if (diff <= 3) points = 4;
      else if (diff <= 10) points = 3;
      else if (diff <= 20) points = 2;

      team.score += points;
      team.lastRoundPoints = points; // For displaying result
    }
  });
}

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
