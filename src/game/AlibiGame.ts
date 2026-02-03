// Alibi Visual Game - Main game controller integrating engine with multiplayer

import { GameEngine } from './GameEngine';
import { GameClient } from '../client';

// Character sprite configurations
const CHARACTER_SPRITES: Record<string, string> = {
  detective: '/Images from Gemini/characters/detective.jpeg',
  businessman: '/Images from Gemini/characters/businessman.png',
  artist: '/Images from Gemini/characters/artist.png',
  scientist: '/Images from Gemini/characters/scientist.png',
  chef: '/Images from Gemini/characters/chef.png',
  athlete: '/Images from Gemini/characters/athelete.png',
  musician: '/Images from Gemini/characters/musician.png',
  teacher: '/Images from Gemini/characters/teacher.png'
};

// Location mapping to crimes
const LOCATION_TO_CRIME: Record<string, string> = {
  museum: 'museum_heist',
  gotham_corp: 'corporate_espionage',
  jewelry_store: 'jewelry_theft',
  jewelry_store_2: 'jewelry_theft',
  diner: 'restaurant_poisoning',
  diner_2: 'restaurant_poisoning',
  city_hall: 'vandalism'
};

export type GamePhase =
  | 'MENU'
  | 'LOBBY'
  | 'EXPLORING'
  | 'ALIBI_CONSTRUCTION'
  | 'INTERROGATION'
  | 'ACCUSATIONS'
  | 'RESULTS';

export interface GameState {
  phase: GamePhase;
  roomCode: string | null;
  players: any[];
  isGuilty: boolean;
  crime: any;
  alibis: Record<string, string>;
  questions: any[];
  currentEvidence: any[];
  phaseStartTime: number | null;
  results: any;
}

export class AlibiGame {
  private engine: GameEngine;
  private client: GameClient;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private uiOverlay: HTMLElement;
  private state: GameState;
  private playerId: string | null = null;
  private playerCharacter: string = 'detective';
  private assetsLoaded: boolean = false;
  private locationPopup: HTMLElement | null = null;
  private timerInterval: number | null = null;
  private showingAlibiForm: boolean = false;
  private isDevMode: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.client = new GameClient();

    // Initialize state
    this.state = {
      phase: 'MENU',
      roomCode: null,
      players: [],
      isGuilty: false,
      crime: null,
      alibis: {},
      questions: [],
      currentEvidence: [],
      phaseStartTime: null,
      results: null
    };

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    this.container.appendChild(this.canvas);

    // Create UI overlay
    this.uiOverlay = document.createElement('div');
    this.uiOverlay.id = 'ui-overlay';
    this.container.appendChild(this.uiOverlay);

    // Initialize engine
    this.engine = new GameEngine(this.canvas);

    // Setup location callbacks
    this.engine.onEnterLocation((locationId) => {
      this.showLocationPopup(locationId);
    });

    this.engine.onExitLocation(() => {
      this.hideLocationPopup();
    });
  }

  async initialize() {
    // Add loading screen
    this.showLoadingScreen();

    try {
      // Load static map image
      await this.engine.loadMap('/Images from Gemini/maps/town_map.jpeg');

      // Load player sprite (default to detective)
      // Sprite sheets are 1024x1024 with 4x4 grid = 256x256 per frame
      await this.engine.loadSpriteSheet(
        'player',
        CHARACTER_SPRITES[this.playerCharacter],
        256, 256, // frame size
        4, 16, 8 // 4 frames per row, 16 total frames, 8 fps
      );

      // Load UI elements
      await this.engine.loadUIElement('dialog', '/Images from Gemini/ui/dialog_box.jpeg', 50, 400);
      await this.engine.loadUIElement('timer', '/Images from Gemini/ui/timer.jpeg', 10, 10);

      // Set initial player position (center of map)
      this.engine.setSpritePosition('player', 600, 400);

      // Setup locations for the static map
      this.engine.setupStaticMapLocations();

      // Add NPCs roaming around the city
      await this.addNPCs();

      this.assetsLoaded = true;

      // Connect to server
      await this.client.connect();
      this.playerId = this.client.getPlayerId();
      this.setupMessageHandlers();

      // Show menu
      this.renderUI();

    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showError('Failed to load game assets');
    }
  }

  private async addNPCs() {
    // Add NPCs using different character sprites, roaming in different areas
    // Static map is 1408x768

    const npcConfigs = [
      {
        id: 'npc_businessman',
        sprite: CHARACTER_SPRITES.businessman,
        x: 300, y: 200,
        bounds: { minX: 200, minY: 150, maxX: 500, maxY: 350 } // Upper center
      },
      {
        id: 'npc_artist',
        sprite: CHARACTER_SPRITES.artist,
        x: 150, y: 400,
        bounds: { minX: 80, minY: 300, maxX: 300, maxY: 500 } // Left side
      },
      {
        id: 'npc_chef',
        sprite: CHARACTER_SPRITES.chef,
        x: 900, y: 200,
        bounds: { minX: 800, minY: 150, maxX: 1000, maxY: 350 } // Right upper
      },
      {
        id: 'npc_scientist',
        sprite: CHARACTER_SPRITES.scientist,
        x: 1100, y: 400,
        bounds: { minX: 1000, minY: 300, maxX: 1300, maxY: 550 } // Right side
      },
      {
        id: 'npc_musician',
        sprite: CHARACTER_SPRITES.musician,
        x: 600, y: 450,
        bounds: { minX: 450, minY: 350, maxX: 800, maxY: 600 } // Center
      },
      {
        id: 'npc_teacher',
        sprite: CHARACTER_SPRITES.teacher,
        x: 400, y: 550,
        bounds: { minX: 250, minY: 450, maxX: 550, maxY: 650 } // Lower center
      }
    ];

    for (const config of npcConfigs) {
      try {
        await this.engine.addNPC(
          config.id,
          config.sprite,
          config.x,
          config.y,
          config.bounds,
          1 + Math.random() * 0.5 // Random speed 1-1.5
        );
      } catch (err) {
        console.warn(`Failed to load NPC ${config.id}:`, err);
      }
    }
  }

  private enterDevMode(playerName: string) {
    this.isDevMode = true;
    this.playerId = 'dev_player_1';

    // Set up fake game state for testing
    this.state = {
      phase: 'EXPLORING',
      roomCode: 'DEV1',
      players: [
        {
          id: 'dev_player_1',
          name: playerName,
          avatar: this.playerCharacter,
          color: '#d4a853',
          score: 0,
          isGuilty: false
        }
      ],
      isGuilty: false,
      crime: {
        id: 'museum_heist',
        title: 'Art Theft',
        description: 'A valuable sculpture was stolen from the east wing of the Meridian Museum at 9:47 PM.',
        location: 'Meridian Museum',
        time: '9:47 PM',
        evidence: [
          { id: 'tattoo', description: 'Security footage shows the thief had a tattoo on their left hand.', revealTime: 30 },
          { id: 'shoes', description: 'Muddy footprints suggest the thief wore size 10 boots.', revealTime: 60 }
        ]
      },
      alibis: {},
      questions: [],
      currentEvidence: [],
      phaseStartTime: Date.now(),
      results: null
    };

    // Start the game engine
    this.engine.start();
    this.startTimerUpdate();

    // Show dev controls
    this.renderUI();

    console.log('🔧 Dev Mode Activated! Controls:');
    console.log('  1 - Switch to EXPLORING phase');
    console.log('  2 - Switch to ALIBI_CONSTRUCTION phase');
    console.log('  3 - Switch to INTERROGATION phase');
    console.log('  4 - Switch to ACCUSATIONS phase');
    console.log('  5 - Switch to RESULTS phase');
    console.log('  G - Toggle guilty status');
    console.log('  E - Add evidence');

    // Add dev keyboard controls
    this.setupDevControls();
  }

  private setupDevControls() {
    window.addEventListener('keydown', (e) => {
      if (!this.isDevMode) return;

      switch (e.key) {
        case '1':
          this.devSetPhase('EXPLORING');
          break;
        case '2':
          this.devSetPhase('ALIBI_CONSTRUCTION');
          break;
        case '3':
          this.devSetPhase('INTERROGATION');
          break;
        case '4':
          this.devSetPhase('ACCUSATIONS');
          break;
        case '5':
          this.devSetPhase('RESULTS');
          break;
        case 'g':
        case 'G':
          this.state.isGuilty = !this.state.isGuilty;
          this.showError(`Guilty: ${this.state.isGuilty}`);
          this.renderUI();
          break;
        case 'e':
        case 'E':
          if (this.state.crime && this.state.crime.evidence) {
            const nextEvidence = this.state.crime.evidence[this.state.currentEvidence.length];
            if (nextEvidence) {
              this.state.currentEvidence.push(nextEvidence);
              this.showEvidenceNotification(nextEvidence);
              this.renderUI();
            }
          }
          break;
      }
    });
  }

  private devSetPhase(phase: GamePhase) {
    this.state.phase = phase;
    this.state.phaseStartTime = Date.now();
    this.showingAlibiForm = false;

    if (phase === 'RESULTS') {
      this.state.results = {
        guiltyPlayerId: this.state.isGuilty ? this.playerId : 'npc_fake',
        votes: {},
        scores: { [this.playerId!]: 250 }
      };
      this.state.players[0].score = 250;
      this.engine.stop();
      this.stopTimerUpdate();
    } else {
      this.engine.start();
      this.startTimerUpdate();
    }

    this.renderUI();
    this.showError(`Phase: ${phase}`);
  }

  private showLoadingScreen() {
    this.uiOverlay.innerHTML = `
      <div class="loading-screen">
        <h1>ALIBI</h1>
        <p>Loading case files...</p>
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
      </div>
    `;
  }

  private setupMessageHandlers() {
    this.client.on('ROOM_CREATED', (payload) => {
      this.state.phase = 'LOBBY';
      this.state.roomCode = payload.roomCode;
      this.state.players = [];
      this.renderUI();
    });

    this.client.on('ROOM_JOINED', (payload) => {
      this.state.phase = 'LOBBY';
      this.state.roomCode = payload.roomCode;
      this.state.players = payload.players;
      this.renderUI();
    });

    this.client.on('PLAYER_JOINED', (payload) => {
      this.state.players.push(payload.player);
      this.renderUI();
    });

    this.client.on('PLAYER_LEFT', (payload) => {
      this.state.players = this.state.players.filter(p => p.id !== payload.playerId);
      this.renderUI();
    });

    this.client.on('PHASE_CHANGE', (payload) => {
      this.handlePhaseChange(payload);
    });

    this.client.on('NEW_QUESTION', (payload) => {
      this.state.questions.push(payload.question);
      this.renderUI();
    });

    this.client.on('QUESTION_ANSWERED', (payload) => {
      const question = this.state.questions.find(q => q.id === payload.questionId);
      if (question) {
        question.answer = payload.answer;
        this.renderUI();
      }
    });

    this.client.on('EVIDENCE_REVEALED', (payload) => {
      this.state.currentEvidence.push(payload.evidence);
      this.showEvidenceNotification(payload.evidence);
      this.renderUI();
    });

    this.client.on('ERROR', (payload) => {
      this.showError(payload.message);
    });
  }

  private handlePhaseChange(payload: any) {
    this.state.crime = payload.crime;
    this.state.isGuilty = payload.isGuilty;
    this.state.phaseStartTime = payload.phaseStartTime;
    this.state.alibis = payload.alibis || {};
    this.state.questions = payload.questions || [];
    this.state.currentEvidence = payload.currentEvidence || [];
    this.state.results = payload.results;
    this.state.players = payload.players || this.state.players;

    switch (payload.phase) {
      case 'SETUP':
        this.state.phase = 'EXPLORING';
        this.startExploring();
        break;
      case 'ALIBI_CONSTRUCTION':
        this.state.phase = 'ALIBI_CONSTRUCTION';
        this.showingAlibiForm = false; // Let player explore first, they can open form when ready
        this.engine.start(); // Keep engine running for exploration
        this.startTimerUpdate();
        break;
      case 'INTERROGATION':
        this.state.phase = 'INTERROGATION';
        break;
      case 'ACCUSATIONS':
        this.state.phase = 'ACCUSATIONS';
        break;
      case 'RESULTS':
        this.state.phase = 'RESULTS';
        this.engine.stop();
        this.stopTimerUpdate();
        break;
    }

    this.renderUI();
  }

  private startExploring() {
    // Start the game engine for exploration
    this.engine.start();
    this.startTimerUpdate();
    this.renderUI();
  }

  private showLocationPopup(locationId: string) {
    // Get location name from engine's locations
    const location = this.engine.getCurrentLocationName();
    const name = location || locationId;

    if (!this.locationPopup) {
      this.locationPopup = document.createElement('div');
      this.locationPopup.className = 'location-popup';
      this.container.appendChild(this.locationPopup);
    }

    this.locationPopup.innerHTML = `
      <div class="location-name">${name}</div>
      <div class="location-hint">Press SPACE to investigate</div>
    `;
    this.locationPopup.style.display = 'block';

    // Handle space key for interaction
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space' && this.locationPopup?.style.display === 'block') {
        this.investigateLocation(locationId);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleSpace);
    this.locationPopup.dataset.handler = 'true';
  }

  private hideLocationPopup() {
    if (this.locationPopup) {
      this.locationPopup.style.display = 'none';
    }
  }

  private investigateLocation(locationId: string) {
    // Show location-specific information
    const crimeId = LOCATION_TO_CRIME[locationId];
    if (crimeId && this.state.crime && this.state.crime.id === crimeId && !this.state.isGuilty) {
      this.showCrimeSceneDialog();
    } else {
      this.showLocationDialog(locationId);
    }
  }

  private showCrimeSceneDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'crime-scene-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h2>Crime Scene</h2>
        <p class="crime-title">${this.state.crime.title}</p>
        <p class="crime-description">${this.state.crime.description}</p>
        <div class="crime-details">
          <p><strong>Location:</strong> ${this.state.crime.location}</p>
          <p><strong>Time:</strong> ${this.state.crime.time}</p>
        </div>
        <button class="close-dialog">Close</button>
      </div>
    `;

    this.container.appendChild(dialog);

    dialog.querySelector('.close-dialog')?.addEventListener('click', () => {
      dialog.remove();
    });
  }

  private showLocationDialog(locationId: string) {
    const descriptions: Record<string, string> = {
      museum: 'The grand Meridian Museum. Ancient artifacts and priceless art line the halls.',
      gotham_corp: 'Gotham Corp headquarters. A towering monument to corporate power.',
      jewelry_store: "Luxurious jewelry store. Diamonds sparkle in the display cases.",
      diner: 'A cozy diner. The smell of coffee and pie fills the air.',
      city_hall: 'The seat of city government. Bureaucrats bustle about.'
    };

    const dialog = document.createElement('div');
    dialog.className = 'location-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <p>${descriptions[locationId] || 'An interesting location...'}</p>
        <button class="close-dialog">Close</button>
      </div>
    `;

    this.container.appendChild(dialog);

    dialog.querySelector('.close-dialog')?.addEventListener('click', () => {
      dialog.remove();
    });
  }

  private showEvidenceNotification(evidence: any) {
    const notification = document.createElement('div');
    notification.className = 'evidence-notification';
    notification.innerHTML = `
      <div class="evidence-alert">
        <img src="/Images from Gemini/evidence/evidence_items.jpeg" class="evidence-img" alt="Evidence" />
        <div class="evidence-content">
          <span class="evidence-label">NEW EVIDENCE</span>
          <span class="evidence-text">${evidence.description}</span>
        </div>
      </div>
    `;

    // Remove background from evidence image
    const img = notification.querySelector('.evidence-img') as HTMLImageElement;
    if (img) {
      img.onload = () => {
        this.removeImageBackground(img);
      };
    }

    this.container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 4000);
  }

  private removeImageBackground(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample corner for background color
    const bgColor = { r: data[0], g: data[1], b: data[2] };
    const tolerance = 35;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const diffR = Math.abs(r - bgColor.r);
      const diffG = Math.abs(g - bgColor.g);
      const diffB = Math.abs(b - bgColor.b);

      if (diffR < tolerance && diffG < tolerance && diffB < tolerance) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    img.src = canvas.toDataURL();
  }

  private showError(message: string) {
    const error = document.createElement('div');
    error.className = 'error-toast';
    error.textContent = message;
    this.container.appendChild(error);

    setTimeout(() => {
      error.remove();
    }, 3000);
  }

  renderUI() {
    switch (this.state.phase) {
      case 'MENU':
        this.renderMenu();
        break;
      case 'LOBBY':
        this.renderLobby();
        break;
      case 'EXPLORING':
        this.renderExploringUI();
        break;
      case 'ALIBI_CONSTRUCTION':
        this.renderAlibiUI();
        break;
      case 'INTERROGATION':
        this.renderInterrogationUI();
        break;
      case 'ACCUSATIONS':
        this.renderAccusationsUI();
        break;
      case 'RESULTS':
        this.renderResultsUI();
        break;
    }

    // Add dev panel if in dev mode
    if (this.isDevMode) {
      this.renderDevPanel();
    }
  }

  private renderDevPanel() {
    // Check if dev panel already exists
    let devPanel = this.container.querySelector('.dev-panel') as HTMLElement;
    if (!devPanel) {
      devPanel = document.createElement('div');
      devPanel.className = 'dev-panel';
      this.container.appendChild(devPanel);
    }

    devPanel.innerHTML = `
      <div class="dev-title">🔧 DEV MODE</div>
      <div class="dev-info">
        <div>Phase: <span class="dev-value">${this.state.phase}</span></div>
        <div>Guilty: <span class="dev-value ${this.state.isGuilty ? 'guilty' : ''}">${this.state.isGuilty ? 'YES' : 'NO'}</span></div>
        <div>Evidence: <span class="dev-value">${this.state.currentEvidence.length}/${this.state.crime?.evidence?.length || 0}</span></div>
      </div>
      <div class="dev-controls">
        <div class="dev-label">Keyboard:</div>
        <div class="dev-key"><kbd>1-5</kbd> Phases</div>
        <div class="dev-key"><kbd>G</kbd> Toggle Guilty</div>
        <div class="dev-key"><kbd>E</kbd> Add Evidence</div>
      </div>
    `;
  }

  private renderMenu() {
    this.uiOverlay.innerHTML = `
      <div class="game-menu">
        <div class="title-container">
          <h1 class="game-title">ALIBI</h1>
          <p class="tagline">A Game of Deception</p>
        </div>

        <div class="character-select">
          <h3>Choose Your Character</h3>
          <div class="character-grid">
            ${Object.keys(CHARACTER_SPRITES).map(char => `
              <div class="character-option ${char === this.playerCharacter ? 'selected' : ''}" data-character="${char}">
                <img src="${CHARACTER_SPRITES[char]}" alt="${char}" />
                <span>${char}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="menu-buttons">
          <button id="create-room-btn" class="btn-primary">Create Room</button>
          <button id="join-room-btn" class="btn-secondary">Join Room</button>
        </div>

        <div class="game-info">
          <h3>How to Play</h3>
          <p>One player committed a crime — but doesn't know what it was.</p>
          <p>Explore the city, construct your alibi, and find the guilty party.</p>
          <p>Use WASD or Arrow Keys to move around the map.</p>
        </div>
      </div>
    `;

    // Add event listeners
    this.uiOverlay.querySelectorAll('.character-option').forEach(el => {
      el.addEventListener('click', async () => {
        this.playerCharacter = el.getAttribute('data-character') || 'detective';
        // Reload the player sprite with new character
        if (this.assetsLoaded) {
          const currentPos = this.engine.getSpritePosition('player');
          await this.engine.loadSpriteSheet(
            'player',
            CHARACTER_SPRITES[this.playerCharacter],
            256, 256,
            4, 16, 8, 0.25
          );
          if (currentPos) {
            this.engine.setSpritePosition('player', currentPos.x, currentPos.y);
          }
        }
        this.renderUI();
      });
    });

    document.getElementById('create-room-btn')?.addEventListener('click', () => {
      this.client.createRoom();
    });

    document.getElementById('join-room-btn')?.addEventListener('click', () => {
      this.showJoinRoomDialog();
    });
  }

  private showJoinRoomDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'join-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h2>Join Investigation</h2>
        <div class="form-group">
          <label>Your Name</label>
          <input type="text" id="player-name" placeholder="Detective..." />
        </div>
        <div class="form-group">
          <label>Room Code</label>
          <input type="text" id="room-code" placeholder="XXXX" maxlength="4" />
        </div>
        <div class="dialog-buttons">
          <button id="confirm-join" class="btn-primary">Enter</button>
          <button id="cancel-join" class="btn-secondary">Cancel</button>
        </div>
      </div>
    `;

    this.container.appendChild(dialog);

    document.getElementById('confirm-join')?.addEventListener('click', () => {
      const name = (document.getElementById('player-name') as HTMLInputElement).value.trim() || 'Detective';
      const code = (document.getElementById('room-code') as HTMLInputElement).value.trim().toLowerCase();

      // Check for dev mode
      if (code === 'dev1') {
        this.enterDevMode(name);
        dialog.remove();
        return;
      }

      if (name && code.length === 4) {
        this.client.joinRoom(code.toUpperCase(), name);
        dialog.remove();
      }
    });

    document.getElementById('cancel-join')?.addEventListener('click', () => {
      dialog.remove();
    });
  }

  private renderLobby() {
    const canStart = this.state.players.length >= 4;

    this.uiOverlay.innerHTML = `
      <div class="lobby-screen">
        <h1>Waiting Room</h1>

        <div class="room-code-display">
          <span class="label">Share This Code</span>
          <span class="code">${this.state.roomCode || '----'}</span>
        </div>

        <div class="players-grid">
          <h3>Suspects (${this.state.players.length}/8)</h3>
          <div class="players-list">
            ${this.state.players.map(p => `
              <div class="player-card">
                <img src="${CHARACTER_SPRITES[p.avatar] || CHARACTER_SPRITES.detective}" alt="${p.avatar}" />
                <span class="player-name">${p.name}</span>
              </div>
            `).join('')}
            ${this.state.players.length < 4 ?
              Array(4 - this.state.players.length).fill(0).map(() => `
                <div class="player-card empty">
                  <div class="placeholder">?</div>
                  <span class="player-name">Waiting...</span>
                </div>
              `).join('') : ''
            }
          </div>
        </div>

        ${canStart ? `
          <button id="start-game-btn" class="btn-primary">Begin Investigation</button>
        ` : `
          <p class="waiting-text">Waiting for more suspects... (${4 - this.state.players.length} more needed)</p>
        `}
      </div>
    `;

    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.client.startGame();
    });
  }

  private renderExploringUI() {
    const timeRemaining = this.getTimeRemaining(5); // Setup phase is 5 seconds

    this.uiOverlay.innerHTML = `
      <div class="exploring-ui">
        <div class="phase-banner ${this.state.isGuilty ? 'guilty' : ''}">
          ${this.state.isGuilty ?
            '<span class="warning">You are the suspect. Something happened... but what?</span>' :
            `<span>A crime has occurred! Explore and gather information.</span>`
          }
        </div>

        <div class="timer-display">
          <span class="time">${timeRemaining}</span>
        </div>

        <div class="controls-hint">
          <span>WASD / Arrow Keys to move</span>
          <span>SPACE to interact</span>
        </div>

        ${!this.state.isGuilty && this.state.crime ? `
          <div class="crime-brief">
            <h4>${this.state.crime.title}</h4>
            <p>${this.state.crime.location} - ${this.state.crime.time}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderAlibiUI() {
    // If not showing form, show the exploring UI with a button to open the form
    if (!this.showingAlibiForm) {
      this.renderAlibiExploringUI();
      return;
    }

    const timeRemaining = this.getTimeRemaining(30);
    const hasSubmitted = this.state.alibis[this.playerId!];

    this.uiOverlay.innerHTML = `
      <div class="alibi-screen">
        <h2>Your Statement</h2>
        <p class="instruction">"Where were you on the night in question?"</p>

        <div class="timer-display">
          <span class="time">${timeRemaining}</span>
        </div>

        <div class="alibi-form">
          <textarea
            id="alibi-textarea"
            placeholder="I was at home, reading. Alone. The rain was hitting the window..."
            rows="6"
            ${hasSubmitted ? 'disabled' : ''}
          >${hasSubmitted || ''}</textarea>

          <div class="alibi-buttons">
            ${!hasSubmitted ? `
              <button id="submit-alibi-btn" class="btn-primary">Submit Statement</button>
            ` : `
              <p class="submitted">Statement recorded</p>
            `}
            <button id="back-to-map-btn" class="btn-secondary">Back to Map</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('submit-alibi-btn')?.addEventListener('click', () => {
      const alibi = (document.getElementById('alibi-textarea') as HTMLTextAreaElement).value.trim();
      if (alibi) {
        this.client.submitAlibi(alibi);
        this.state.alibis[this.playerId!] = alibi;
        this.renderUI();
      }
    });

    document.getElementById('back-to-map-btn')?.addEventListener('click', () => {
      this.showingAlibiForm = false;
      this.renderUI();
    });
  }

  private renderAlibiExploringUI() {
    const timeRemaining = this.getTimeRemaining(30);
    const hasSubmitted = this.state.alibis[this.playerId!];

    this.uiOverlay.innerHTML = `
      <div class="exploring-ui">
        <div class="phase-banner alibi-phase">
          <span>Alibi Construction Phase - Explore and prepare your statement</span>
        </div>

        <div class="timer-display">
          <span class="time">${timeRemaining}</span>
        </div>

        <div class="controls-hint">
          <span>WASD / Arrow Keys to move</span>
          <span>SPACE to interact</span>
        </div>

        <button id="open-alibi-btn" class="floating-btn ${hasSubmitted ? 'submitted' : ''}">
          ${hasSubmitted ? 'View Statement' : 'Write Statement'}
        </button>

        ${!this.state.isGuilty && this.state.crime ? `
          <div class="crime-brief">
            <h4>${this.state.crime.title}</h4>
            <p>${this.state.crime.location} - ${this.state.crime.time}</p>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('open-alibi-btn')?.addEventListener('click', () => {
      this.showingAlibiForm = true;
      this.renderUI();
    });
  }

  private renderInterrogationUI() {
    const timeRemaining = this.getTimeRemaining(30);
    const myQuestions = this.state.questions.filter(q => q.from === this.playerId).length;

    this.uiOverlay.innerHTML = `
      <div class="interrogation-screen">
        <h2>Interrogation Room</h2>

        <div class="timer-display">
          <span class="time">${timeRemaining}</span>
        </div>

        ${this.state.currentEvidence.length > 0 && !this.state.isGuilty ? `
          <div class="evidence-panel">
            <h3>🔍 Evidence Found</h3>
            ${this.state.currentEvidence.map(e => `
              <div class="evidence-item">
                <img src="/Images from Gemini/evidence/evidence_items.jpeg" class="evidence-item-img" alt="Evidence" />
                <span>${e.description}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="suspects-panel">
          <h3>Interrogate Suspects (${3 - myQuestions} questions left)</h3>
          ${this.state.players.filter(p => p.id !== this.playerId).map(p => `
            <div class="suspect-row">
              <div class="suspect-info">
                <strong>${p.name}</strong>
                <span class="alibi-preview">"${(this.state.alibis[p.id] || '...').substring(0, 50)}..."</span>
              </div>
              ${myQuestions < 3 ? `
                <div class="question-input">
                  <input type="text" class="question-field" data-player="${p.id}" placeholder="Ask a question..." />
                  <button class="ask-btn btn-secondary" data-player="${p.id}">Ask</button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="my-questions-panel">
          <h3>Questions for You</h3>
          ${this.state.questions
            .filter(q => q.to === this.playerId && !q.answer)
            .map(q => {
              const asker = this.state.players.find(p => p.id === q.from);
              return `
                <div class="question-to-answer">
                  <p><strong>${asker?.name}</strong> asks: "${q.question}"</p>
                  <div class="answer-input">
                    <input type="text" class="answer-field" data-question="${q.id}" placeholder="Your response..." />
                    <button class="answer-btn btn-primary" data-question="${q.id}">Respond</button>
                  </div>
                </div>
              `;
            }).join('') || '<p class="no-questions">No questions for you yet.</p>'
          }
        </div>

        <div class="transcript-panel">
          <h3>Transcript</h3>
          <div class="transcript-content">
            ${this.state.questions.map(q => {
              const asker = this.state.players.find(p => p.id === q.from);
              const answerer = this.state.players.find(p => p.id === q.to);
              return `
                <div class="qa-item">
                  <p><strong>${asker?.name}</strong> → <strong>${answerer?.name}</strong>: "${q.question}"</p>
                  ${q.answer ? `<p class="answer">"${q.answer}"</p>` : '<p class="pending">Awaiting response...</p>'}
                </div>
              `;
            }).join('') || '<p class="empty">No questions asked yet.</p>'}
          </div>
        </div>
      </div>
    `;

    // Add event listeners for asking questions
    this.uiOverlay.querySelectorAll('.ask-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const playerId = btn.getAttribute('data-player')!;
        const input = this.uiOverlay.querySelector(`.question-field[data-player="${playerId}"]`) as HTMLInputElement;
        if (input.value.trim()) {
          this.client.askQuestion(playerId, input.value.trim());
          input.value = '';
        }
      });
    });

    // Add event listeners for answering questions
    this.uiOverlay.querySelectorAll('.answer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const questionId = btn.getAttribute('data-question')!;
        const input = this.uiOverlay.querySelector(`.answer-field[data-question="${questionId}"]`) as HTMLInputElement;
        if (input.value.trim()) {
          this.client.answerQuestion(questionId, input.value.trim());
        }
      });
    });
  }

  private renderAccusationsUI() {
    const timeRemaining = this.getTimeRemaining(20);

    this.uiOverlay.innerHTML = `
      <div class="accusations-screen">
        <h2>The Accusation</h2>
        <p class="instruction">"Point your finger. Who did it?"</p>

        <div class="timer-display">
          <span class="time">${timeRemaining}</span>
        </div>

        <div class="voting-form">
          <label>Name Your Suspect</label>
          <select id="suspect-select">
            <option value="">Select a suspect...</option>
            ${this.state.players.filter(p => p.id !== this.playerId).map(p => `
              <option value="${p.id}">${p.name}</option>
            `).join('')}
          </select>

          <label>How Certain Are You?</label>
          <select id="confidence-select">
            <option value="1">"I have my suspicions..." (×1)</option>
            <option value="2">"I'm fairly confident." (×2)</option>
            <option value="3">"I'd bet my badge on it." (×3)</option>
          </select>

          <button id="submit-vote-btn" class="btn-danger">Make Accusation</button>
        </div>
      </div>
    `;

    document.getElementById('submit-vote-btn')?.addEventListener('click', () => {
      const suspectId = (document.getElementById('suspect-select') as HTMLSelectElement).value;
      const confidence = parseInt((document.getElementById('confidence-select') as HTMLSelectElement).value);
      if (suspectId) {
        this.client.submitVote(suspectId, confidence);
        this.showError('Accusation recorded!');
      }
    });
  }

  private renderResultsUI() {
    const guiltyPlayer = this.state.players.find(p => p.id === this.state.results?.guiltyPlayerId);
    const sortedPlayers = [...this.state.players].sort((a, b) => (b.score || 0) - (a.score || 0));

    this.uiOverlay.innerHTML = `
      <div class="results-screen">
        <h1>Case Closed</h1>

        <div class="guilty-reveal">
          <h2>${this.state.isGuilty ? 'You Were The Culprit' : 'The Guilty Party'}</h2>
          <div class="guilty-player">
            <img src="${CHARACTER_SPRITES[guiltyPlayer?.avatar || 'detective']}" alt="Guilty" />
            <span class="guilty-name">${guiltyPlayer?.name || 'Unknown'}</span>
          </div>
        </div>

        <div class="scores-panel">
          <h3>Final Scores</h3>
          ${sortedPlayers.map((p, i) => `
            <div class="score-row ${i === 0 ? 'winner' : ''} ${p.id === this.state.results?.guiltyPlayerId ? 'guilty' : ''}">
              <span>${i === 0 ? '🏆 ' : ''}${p.name} ${p.id === this.state.results?.guiltyPlayerId ? '(Guilty)' : ''}</span>
              <span class="score">${p.score || 0}</span>
            </div>
          `).join('')}
        </div>

        <button id="play-again-btn" class="btn-primary">Play Again</button>
      </div>
    `;

    document.getElementById('play-again-btn')?.addEventListener('click', () => {
      this.state.phase = 'LOBBY';
      this.renderUI();
    });
  }

  private getTimeRemaining(phaseDuration: number): string {
    if (!this.state.phaseStartTime) return '--:--';

    const elapsed = Math.floor((Date.now() - this.state.phaseStartTime) / 1000);
    const remaining = Math.max(0, phaseDuration - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private startTimerUpdate() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = window.setInterval(() => {
      // Update only the timer element if it exists
      const timerEl = this.uiOverlay.querySelector('.timer-display .time');
      if (timerEl) {
        // Fast 90-second game durations
        const phaseDurations: Record<string, number> = {
          'EXPLORING': 5,
          'ALIBI_CONSTRUCTION': 30,
          'INTERROGATION': 30,
          'ACCUSATIONS': 20
        };
        const duration = phaseDurations[this.state.phase] || 30;
        timerEl.textContent = this.getTimeRemaining(duration);
      }
    }, 1000);
  }

  private stopTimerUpdate() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
