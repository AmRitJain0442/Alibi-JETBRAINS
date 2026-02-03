// Game State Management for Alibi

import { GameState, GamePhase, Player, Question, PLAYER_COLORS, AVATARS } from './types';
import { getRandomCrime } from './crimes';

export class GameManager {
  private state: GameState;
  private phaseTimer: number | null = null;
  private onStateChange?: (state: GameState) => void;

  constructor(roomCode: string) {
    this.state = {
      roomCode,
      phase: 'WAITING',
      players: new Map(),
      crime: null,
      guiltyPlayerId: null,
      currentEvidence: [],
      questions: [],
      phaseEndTime: null,
      roundNumber: 0
    };
  }

  public getState(): GameState {
    return this.state;
  }

  public onUpdate(callback: (state: GameState) => void) {
    this.onStateChange = callback;
  }

  private emit() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  public addPlayer(id: string, name: string): Player {
    const colorIndex = this.state.players.size % PLAYER_COLORS.length;
    const avatarIndex = this.state.players.size % AVATARS.length;
    
    const player: Player = {
      id,
      name,
      color: PLAYER_COLORS[colorIndex],
      avatar: AVATARS[avatarIndex],
      isGuilty: false,
      alibi: '',
      score: 0,
      questions: []
    };

    this.state.players.set(id, player);
    this.emit();
    return player;
  }

  public removePlayer(id: string) {
    this.state.players.delete(id);
    this.emit();
  }

  public canStartGame(): boolean {
    return this.state.players.size >= 4 && this.state.phase === 'WAITING';
  }

  public startGame() {
    if (!this.canStartGame()) return;

    this.state.roundNumber++;
    this.state.crime = getRandomCrime();
    
    // Randomly select guilty player
    const playerIds = Array.from(this.state.players.keys());
    const guiltyIndex = Math.floor(Math.random() * playerIds.length);
    this.state.guiltyPlayerId = playerIds[guiltyIndex];

    // Mark the guilty player
    const guiltyPlayer = this.state.players.get(this.state.guiltyPlayerId);
    if (guiltyPlayer) {
      guiltyPlayer.isGuilty = true;
    }

    // Reset all player data
    this.state.players.forEach(player => {
      player.alibi = '';
      player.vote = undefined;
      player.confidence = undefined;
      player.questions = [];
    });

    this.state.questions = [];
    this.state.currentEvidence = [];
    
    this.changePhase('SETUP');
  }

  private changePhase(newPhase: GamePhase) {
    this.state.phase = newPhase;
    
    // Clear existing timer
    if (this.phaseTimer !== null) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    // Set phase duration and auto-advance
    // TOTAL TARGET: ~90 seconds for fast gameplay
    const phaseDurations: Record<GamePhase, number | null> = {
      'WAITING': null,
      'SETUP': 5000, // 5 seconds - quick crime reveal
      'ALIBI_CONSTRUCTION': 30000, // 30 seconds - write your alibi fast!
      'INTERROGATION': 30000, // 30 seconds - rapid-fire questions
      'EVIDENCE_DROP': null, // handled during interrogation
      'ACCUSATIONS': 20000, // 20 seconds - vote quickly!
      'RESULTS': 10000 // 10 seconds - see who won
    };
    // Total: 5 + 30 + 30 + 20 + 10 = 95 seconds = 1:35

    const duration = phaseDurations[newPhase];
    if (duration !== null) {
      this.state.phaseEndTime = Date.now() + duration;
      
      this.phaseTimer = setTimeout(() => {
        this.advancePhase();
      }, duration) as any;

      // Schedule evidence reveals during interrogation
      if (newPhase === 'INTERROGATION' && this.state.crime) {
        this.scheduleEvidenceReveals();
      }
    } else {
      this.state.phaseEndTime = null;
    }

    this.emit();
  }

  private scheduleEvidenceReveals() {
    if (!this.state.crime) return;

    this.state.crime.evidence.forEach(evidence => {
      setTimeout(() => {
        if (this.state.phase === 'INTERROGATION') {
          this.state.currentEvidence.push(evidence);
          this.emit();
        }
      }, evidence.revealTime * 1000);
    });
  }

  private advancePhase() {
    const phaseOrder: GamePhase[] = [
      'WAITING',
      'SETUP',
      'ALIBI_CONSTRUCTION',
      'INTERROGATION',
      'ACCUSATIONS',
      'RESULTS'
    ];

    const currentIndex = phaseOrder.indexOf(this.state.phase);
    if (currentIndex < phaseOrder.length - 1) {
      this.changePhase(phaseOrder[currentIndex + 1]);
    } else {
      // Round complete, go back to waiting
      this.changePhase('WAITING');
    }
  }

  public submitAlibi(playerId: string, alibi: string) {
    const player = this.state.players.get(playerId);
    if (player && this.state.phase === 'ALIBI_CONSTRUCTION') {
      player.alibi = alibi;
      this.emit();
    }
  }

  public askQuestion(fromId: string, toId: string, questionText: string) {
    if (this.state.phase !== 'INTERROGATION') return;

    const fromPlayer = this.state.players.get(fromId);
    if (!fromPlayer) return;

    // Check if player has questions remaining (max 3 per player)
    const questionsAsked = this.state.questions.filter(q => q.from === fromId).length;
    if (questionsAsked >= 3) return;

    const question: Question = {
      id: `q_${Date.now()}_${Math.random()}`,
      from: fromId,
      to: toId,
      question: questionText,
      timestamp: Date.now()
    };

    this.state.questions.push(question);
    this.emit();
  }

  public answerQuestion(questionId: string, answer: string) {
    const question = this.state.questions.find(q => q.id === questionId);
    if (question && !question.answer) {
      question.answer = answer;
      this.emit();
    }
  }

  public submitVote(playerId: string, suspectId: string, confidence: number) {
    const player = this.state.players.get(playerId);
    if (player && this.state.phase === 'ACCUSATIONS') {
      player.vote = suspectId;
      player.confidence = Math.min(3, Math.max(1, confidence));
      this.emit();
    }
  }

  public calculateResults() {
    if (!this.state.guiltyPlayerId) return;

    const guiltyPlayer = this.state.players.get(this.state.guiltyPlayerId);
    let fooledCount = 0;

    this.state.players.forEach(player => {
      if (player.id === this.state.guiltyPlayerId) return;

      // Calculate points for innocent players
      if (player.vote === this.state.guiltyPlayerId) {
        // Correct vote
        const points = 100 * (player.confidence || 1);
        player.score += points;
      } else {
        // Wrong vote
        fooledCount++;
      }
    });

    // Points for guilty player based on how many they fooled
    if (guiltyPlayer) {
      guiltyPlayer.score += fooledCount * 150;
    }

    this.emit();
  }

  public getPlayerCount(): number {
    return this.state.players.size;
  }

  public getPlayer(id: string): Player | undefined {
    return this.state.players.get(id);
  }
}
