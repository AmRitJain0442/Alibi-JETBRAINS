// WebSocket Server for Alibi Multiplayer Game

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const PORT = 8080;
const LEADERBOARD_FILE = './leaderboard.json';

// Phase durations for fast ~90 second gameplay
const PHASE_DURATIONS = {
  'SETUP': 5000,            // 5 seconds
  'ALIBI_CONSTRUCTION': 30000, // 30 seconds
  'INTERROGATION': 30000,   // 30 seconds
  'ACCUSATIONS': 20000,     // 20 seconds
  'RESULTS': 10000          // 10 seconds
};
// Total: 5 + 30 + 30 + 20 + 10 = 95 seconds = 1:35

class AlibiServer {
  constructor() {
    this.server = createServer((req, res) => this.handleHTTP(req, res));
    this.wss = new WebSocketServer({ server: this.server });
    this.rooms = new Map(); // roomCode -> Room
    this.clients = new Map(); // ws -> ClientData
    this.leaderboard = this.loadLeaderboard();

    this.setupWebSocket();
  }

  // Load leaderboard from file
  loadLeaderboard() {
    try {
      if (existsSync(LEADERBOARD_FILE)) {
        const data = readFileSync(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
    return [];
  }

  // Save leaderboard to file
  saveLeaderboard() {
    try {
      writeFileSync(LEADERBOARD_FILE, JSON.stringify(this.leaderboard, null, 2));
    } catch (err) {
      console.error('Error saving leaderboard:', err);
    }
  }

  // Add score to leaderboard
  addToLeaderboard(playerName, score) {
    const entry = {
      name: playerName,
      score: score,
      timestamp: Date.now()
    };

    this.leaderboard.push(entry);
    // Sort by score descending, keep top 100
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 100);
    this.saveLeaderboard();

    // Broadcast leaderboard update to all connected clients
    this.broadcastLeaderboard();
  }

  // Broadcast leaderboard to all clients
  broadcastLeaderboard() {
    const top10 = this.leaderboard.slice(0, 10);
    this.clients.forEach((data, ws) => {
      this.send(ws, {
        type: 'LEADERBOARD_UPDATE',
        payload: { leaderboard: top10 }
      });
    });
  }

  // HTTP handler for REST endpoints (leaderboard display)
  handleHTTP(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/leaderboard' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        leaderboard: this.leaderboard.slice(0, 20),
        totalPlayers: this.leaderboard.length,
        lastUpdated: Date.now()
      }));
      return;
    }

    if (req.url === '/leaderboard/display' && req.method === 'GET') {
      // Serve a standalone leaderboard display page for event screens
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.getLeaderboardHTML());
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  // Generate standalone leaderboard HTML for event display
  getLeaderboardHTML() {
    return `<!DOCTYPE html>
<html>
<head>
  <title>ALIBI - Live Leaderboard</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
      color: #d4a853;
      font-family: 'Press Start 2P', monospace;
      min-height: 100vh;
      padding: 40px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    h1 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 10px;
      text-shadow: 0 0 20px #d4a853;
      animation: glow 2s ease-in-out infinite alternate;
    }

    @keyframes glow {
      from { text-shadow: 0 0 10px #d4a853, 0 0 20px #d4a853; }
      to { text-shadow: 0 0 20px #d4a853, 0 0 40px #d4a853, 0 0 60px #d4a853; }
    }

    .subtitle {
      text-align: center;
      color: #888;
      font-size: 0.7rem;
      margin-bottom: 40px;
    }

    .leaderboard {
      background: rgba(0, 0, 0, 0.6);
      border: 3px solid #d4a853;
      border-radius: 10px;
      overflow: hidden;
    }

    .entry {
      display: flex;
      align-items: center;
      padding: 20px 30px;
      border-bottom: 1px solid rgba(212, 168, 83, 0.3);
      transition: background 0.3s;
    }

    .entry:hover { background: rgba(212, 168, 83, 0.1); }

    .entry:last-child { border-bottom: none; }

    .rank {
      font-size: 1.5rem;
      width: 80px;
      color: #888;
    }

    .entry:nth-child(1) .rank { color: #ffd700; }
    .entry:nth-child(2) .rank { color: #c0c0c0; }
    .entry:nth-child(3) .rank { color: #cd7f32; }

    .name {
      flex: 1;
      font-size: 1rem;
      color: #fff;
    }

    .score {
      font-size: 1.2rem;
      color: #4ade80;
    }

    .empty {
      text-align: center;
      padding: 60px;
      color: #666;
      font-size: 0.8rem;
    }

    .live-indicator {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.6rem;
      color: #4ade80;
    }

    .live-dot {
      width: 12px;
      height: 12px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
  </style>
</head>
<body>
  <div class="live-indicator">
    <div class="live-dot"></div>
    LIVE
  </div>

  <div class="container">
    <h1>🔍 ALIBI</h1>
    <p class="subtitle">TOP DETECTIVES</p>

    <div class="leaderboard" id="leaderboard">
      <div class="empty">Waiting for players...</div>
    </div>
  </div>

  <script>
    const ws = new WebSocket('ws://' + window.location.host);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'LEADERBOARD_UPDATE' || msg.type === 'CONNECTED') {
        fetchLeaderboard();
      }
    };

    async function fetchLeaderboard() {
      try {
        const res = await fetch('/leaderboard');
        const data = await res.json();
        renderLeaderboard(data.leaderboard);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      }
    }

    function renderLeaderboard(entries) {
      const container = document.getElementById('leaderboard');

      if (!entries || entries.length === 0) {
        container.innerHTML = '<div class="empty">Waiting for players...</div>';
        return;
      }

      container.innerHTML = entries.slice(0, 10).map((entry, i) => \`
        <div class="entry">
          <span class="rank">#\${i + 1}</span>
          <span class="name">\${entry.name}</span>
          <span class="score">\${entry.score.toLocaleString()}</span>
        </div>
      \`).join('');
    }

    // Initial fetch
    fetchLeaderboard();

    // Refresh every 10 seconds as backup
    setInterval(fetchLeaderboard, 10000);
  </script>
</body>
</html>`;
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      
      const clientData = {
        ws,
        playerId: this.generateId(),
        roomCode: null,
        playerName: null
      };
      
      this.clients.set(ws, clientData);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.handleDisconnect(ws);
      });

      // Send connection confirmation
      this.send(ws, {
        type: 'CONNECTED',
        payload: { playerId: clientData.playerId }
      });
    });
  }

  handleMessage(ws, message) {
    const clientData = this.clients.get(ws);
    if (!clientData) return;

    switch (message.type) {
      case 'CREATE_ROOM':
        this.createRoom(ws, clientData);
        break;
      
      case 'JOIN_ROOM':
        this.joinRoom(ws, clientData, message.payload.roomCode, message.payload.playerName);
        break;
      
      case 'START_GAME':
        this.startGame(clientData.roomCode);
        break;
      
      case 'SUBMIT_ALIBI':
        this.submitAlibi(clientData, message.payload.alibi);
        break;
      
      case 'ASK_QUESTION':
        this.askQuestion(clientData, message.payload.toId, message.payload.question);
        break;
      
      case 'ANSWER_QUESTION':
        this.answerQuestion(clientData, message.payload.questionId, message.payload.answer);
        break;
      
      case 'SUBMIT_VOTE':
        this.submitVote(clientData, message.payload.suspectId, message.payload.confidence);
        break;
    }
  }

  createRoom(ws, clientData) {
    const roomCode = this.generateRoomCode();
    const room = {
      code: roomCode,
      host: clientData.playerId,
      players: new Map(),
      gameState: {
        phase: 'WAITING',
        crime: null,
        guiltyPlayerId: null,
        alibis: new Map(),
        questions: [],
        votes: new Map(),
        currentEvidence: [],
        phaseStartTime: null,
        roundNumber: 0
      },
      timers: {
        phaseTimer: null,
        evidenceTimers: []
      }
    };

    this.rooms.set(roomCode, room);
    
    this.send(ws, {
      type: 'ROOM_CREATED',
      payload: { roomCode }
    });
  }

  joinRoom(ws, clientData, roomCode, playerName) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      this.send(ws, {
        type: 'ERROR',
        payload: { message: 'Room not found' }
      });
      return;
    }

    if (room.players.size >= 8) {
      this.send(ws, {
        type: 'ERROR',
        payload: { message: 'Room is full' }
      });
      return;
    }

    if (room.gameState.phase !== 'WAITING') {
      this.send(ws, {
        type: 'ERROR',
        payload: { message: 'Game already in progress' }
      });
      return;
    }

    // Add player to room
    clientData.roomCode = roomCode;
    clientData.playerName = playerName;

    const colorIndex = room.players.size % 8;
    const avatarIndex = room.players.size % 8;
    
    const COLORS = ['#E63946', '#457B9D', '#2A9D8F', '#E9C46A', '#F4A261', '#9D4EDD', '#06FFA5', '#FF006E'];
    const AVATARS = ['detective', 'businessman', 'artist', 'scientist', 'chef', 'athlete', 'musician', 'teacher'];

    const player = {
      id: clientData.playerId,
      name: playerName,
      color: COLORS[colorIndex],
      avatar: AVATARS[avatarIndex],
      score: 0,
      isGuilty: false
    };

    room.players.set(clientData.playerId, player);

    // Notify all players in room
    this.broadcastToRoom(roomCode, {
      type: 'PLAYER_JOINED',
      payload: { player, playerCount: room.players.size }
    });

    // Send current game state to joining player
    this.send(ws, {
      type: 'ROOM_JOINED',
      payload: {
        roomCode,
        players: Array.from(room.players.values()),
        gameState: this.getPublicGameState(room, clientData.playerId)
      }
    });
  }

  startGame(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room || room.players.size < 4) return;

    room.gameState.roundNumber++;
    room.gameState.phase = 'SETUP';
    
    // Select random crime
    const crimes = this.getCrimes();
    room.gameState.crime = crimes[Math.floor(Math.random() * crimes.length)];
    
    // Select random guilty player
    const playerIds = Array.from(room.players.keys());
    room.gameState.guiltyPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // Reset game data
    room.gameState.alibis.clear();
    room.gameState.questions = [];
    room.gameState.votes.clear();
    room.gameState.currentEvidence = [];

    // Start setup phase
    this.startPhase(roomCode, 'SETUP', PHASE_DURATIONS['SETUP']);
  }

  startPhase(roomCode, phase, duration) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.gameState.phase = phase;
    room.gameState.phaseStartTime = Date.now();

    // Clear existing timers
    if (room.timers.phaseTimer) {
      clearTimeout(room.timers.phaseTimer);
    }
    room.timers.evidenceTimers.forEach(timer => clearTimeout(timer));
    room.timers.evidenceTimers = [];

    // Broadcast phase change
    this.broadcastPhaseUpdate(roomCode);

    // Set timer for next phase
    if (duration) {
      room.timers.phaseTimer = setTimeout(() => {
        this.advancePhase(roomCode);
      }, duration);
    }

    // Schedule evidence reveals for interrogation phase
    if (phase === 'INTERROGATION' && room.gameState.crime) {
      room.gameState.crime.evidence.forEach(evidence => {
        const timer = setTimeout(() => {
          room.gameState.currentEvidence.push(evidence);
          this.broadcastToRoom(roomCode, {
            type: 'EVIDENCE_REVEALED',
            payload: { evidence }
          });
        }, evidence.revealTime * 1000);
        
        room.timers.evidenceTimers.push(timer);
      });
    }
  }

  advancePhase(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const phaseSequence = ['SETUP', 'ALIBI_CONSTRUCTION', 'INTERROGATION', 'ACCUSATIONS', 'RESULTS'];
    const currentIndex = phaseSequence.indexOf(room.gameState.phase);
    
    if (currentIndex === -1) return;

    if (currentIndex === phaseSequence.indexOf('ACCUSATIONS')) {
      // Calculate results before showing them
      this.calculateResults(roomCode);
    }

    if (currentIndex < phaseSequence.length - 1) {
      const nextPhase = phaseSequence[currentIndex + 1];
      this.startPhase(roomCode, nextPhase, PHASE_DURATIONS[nextPhase]);
    } else {
      // Round complete
      room.gameState.phase = 'WAITING';
      room.gameState.guiltyPlayerId = null;
      this.broadcastPhaseUpdate(roomCode);
    }
  }

  submitAlibi(clientData, alibi) {
    const room = this.rooms.get(clientData.roomCode);
    if (!room || room.gameState.phase !== 'ALIBI_CONSTRUCTION') return;

    room.gameState.alibis.set(clientData.playerId, alibi);
    
    this.broadcastToRoom(clientData.roomCode, {
      type: 'ALIBI_SUBMITTED',
      payload: { playerId: clientData.playerId }
    });
  }

  askQuestion(clientData, toId, questionText) {
    const room = this.rooms.get(clientData.roomCode);
    if (!room || room.gameState.phase !== 'INTERROGATION') return;

    // Check question limit
    const questionsAsked = room.gameState.questions.filter(q => q.from === clientData.playerId).length;
    if (questionsAsked >= 3) return;

    const question = {
      id: `q_${Date.now()}_${Math.random()}`,
      from: clientData.playerId,
      to: toId,
      question: questionText,
      answer: null,
      timestamp: Date.now()
    };

    room.gameState.questions.push(question);

    this.broadcastToRoom(clientData.roomCode, {
      type: 'NEW_QUESTION',
      payload: { question }
    });
  }

  answerQuestion(clientData, questionId, answer) {
    const room = this.rooms.get(clientData.roomCode);
    if (!room) return;

    const question = room.gameState.questions.find(q => q.id === questionId);
    if (!question || question.to !== clientData.playerId || question.answer) return;

    question.answer = answer;

    this.broadcastToRoom(clientData.roomCode, {
      type: 'QUESTION_ANSWERED',
      payload: { questionId, answer }
    });
  }

  submitVote(clientData, suspectId, confidence) {
    const room = this.rooms.get(clientData.roomCode);
    if (!room || room.gameState.phase !== 'ACCUSATIONS') return;

    room.gameState.votes.set(clientData.playerId, {
      suspectId,
      confidence: Math.min(3, Math.max(1, confidence))
    });

    this.broadcastToRoom(clientData.roomCode, {
      type: 'VOTE_SUBMITTED',
      payload: { playerId: clientData.playerId }
    });
  }

  calculateResults(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const results = {
      guiltyPlayerId: room.gameState.guiltyPlayerId,
      votes: {},
      scores: {}
    };

    let fooledCount = 0;

    room.gameState.votes.forEach((vote, voterId) => {
      results.votes[voterId] = vote;
      
      const player = room.players.get(voterId);
      if (!player) return;

      if (vote.suspectId === room.gameState.guiltyPlayerId) {
        // Correct vote
        const points = 100 * vote.confidence;
        player.score += points;
      } else {
        fooledCount++;
      }
      
      results.scores[voterId] = player.score;
    });

    // Award points to guilty player
    const guiltyPlayer = room.players.get(room.gameState.guiltyPlayerId);
    if (guiltyPlayer) {
      guiltyPlayer.score += fooledCount * 150;
      results.scores[room.gameState.guiltyPlayerId] = guiltyPlayer.score;
    }

    room.gameState.results = results;

    // Add all players to leaderboard
    room.players.forEach((player) => {
      if (player.score > 0) {
        this.addToLeaderboard(player.name, player.score);
      }
    });
  }

  broadcastPhaseUpdate(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Send personalized updates to each player
    room.players.forEach((player, playerId) => {
      const client = Array.from(this.clients.entries())
        .find(([ws, data]) => data.playerId === playerId);
      
      if (client) {
        this.send(client[0], {
          type: 'PHASE_CHANGE',
          payload: this.getPublicGameState(room, playerId)
        });
      }
    });
  }

  getPublicGameState(room, playerId) {
    const isGuilty = room.gameState.guiltyPlayerId === playerId;
    
    return {
      phase: room.gameState.phase,
      phaseStartTime: room.gameState.phaseStartTime,
      crime: isGuilty ? {
        location: room.gameState.crime?.location,
        time: room.gameState.crime?.time,
        hidden: true
      } : room.gameState.crime,
      isGuilty,
      players: Array.from(room.players.values()),
      alibis: Object.fromEntries(room.gameState.alibis),
      questions: room.gameState.questions,
      currentEvidence: room.gameState.currentEvidence,
      results: room.gameState.results
    };
  }

  broadcastToRoom(roomCode, message) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players.forEach((player, playerId) => {
      const client = Array.from(this.clients.entries())
        .find(([ws, data]) => data.playerId === playerId);
      
      if (client) {
        this.send(client[0], message);
      }
    });
  }

  handleDisconnect(ws) {
    const clientData = this.clients.get(ws);
    if (!clientData) return;

    if (clientData.roomCode) {
      const room = this.rooms.get(clientData.roomCode);
      if (room) {
        room.players.delete(clientData.playerId);
        
        this.broadcastToRoom(clientData.roomCode, {
          type: 'PLAYER_LEFT',
          payload: { playerId: clientData.playerId, playerCount: room.players.size }
        });

        // Delete room if empty
        if (room.players.size === 0) {
          this.rooms.delete(clientData.roomCode);
        }
      }
    }

    this.clients.delete(ws);
  }

  send(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  getCrimes() {
    // Evidence reveal times adjusted for 30-second interrogation phase
    return [
      {
        id: 'museum_heist',
        title: 'Art Theft',
        description: 'A valuable sculpture was stolen from the Meridian Museum at 9:47 PM.',
        location: 'Meridian Museum',
        time: '9:47 PM',
        evidence: [
          { id: 'tattoo', description: 'The thief had a tattoo on their left hand.', revealTime: 10 },
          { id: 'shoes', description: 'Muddy size 10 boot prints were found.', revealTime: 20 }
        ]
      },
      {
        id: 'corporate_espionage',
        title: 'Data Breach',
        description: 'Files were stolen from TechCorp HQ at 11:23 PM.',
        location: 'TechCorp HQ',
        time: '11:23 PM',
        evidence: [
          { id: 'coffee', description: 'A coffee cup with lipstick was found.', revealTime: 10 },
          { id: 'parking', description: 'A car with tinted windows was seen.', revealTime: 20 }
        ]
      },
      {
        id: 'jewelry_theft',
        title: 'Diamond Heist',
        description: 'Diamonds worth $50K stolen from Luxe Jewelers at 8:15 PM.',
        location: 'Luxe Jewelers',
        time: '8:15 PM',
        evidence: [
          { id: 'gloves', description: 'A latex glove was found at the scene.', revealTime: 10 },
          { id: 'witness', description: 'Someone in a red jacket was seen nearby.', revealTime: 20 }
        ]
      }
    ];
  }

  start() {
    this.server.listen(PORT, () => {
      console.log(`Alibi WebSocket Server running on port ${PORT}`);
    });
  }
}

const server = new AlibiServer();
server.start();
