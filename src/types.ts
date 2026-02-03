// Game Types for Alibi

export type GamePhase = 
  | 'WAITING'
  | 'SETUP'
  | 'ALIBI_CONSTRUCTION'
  | 'INTERROGATION'
  | 'EVIDENCE_DROP'
  | 'ACCUSATIONS'
  | 'RESULTS';

export interface Crime {
  id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  description: string;
  revealTime: number; // When this evidence is revealed (in seconds into interrogation)
}

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string; // silhouette type
  isGuilty: boolean;
  alibi: string;
  score: number;
  vote?: string; // player ID they voted for
  confidence?: number; // 1-3 wager
  questions: Question[];
}

export interface Question {
  id: string;
  from: string; // player ID
  to: string; // player ID
  question: string;
  answer?: string;
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Map<string, Player>;
  crime: Crime | null;
  guiltyPlayerId: string | null;
  currentEvidence: Evidence[];
  questions: Question[];
  phaseEndTime: number | null;
  roundNumber: number;
}

export interface ClientMessage {
  type: 
    | 'JOIN_ROOM'
    | 'SET_NAME'
    | 'SUBMIT_ALIBI'
    | 'ASK_QUESTION'
    | 'ANSWER_QUESTION'
    | 'SUBMIT_VOTE'
    | 'START_GAME';
  payload: any;
}

export interface ServerMessage {
  type:
    | 'ROOM_JOINED'
    | 'GAME_STATE'
    | 'PHASE_CHANGE'
    | 'PLAYER_JOINED'
    | 'PLAYER_LEFT'
    | 'CRIME_INFO'
    | 'NEW_QUESTION'
    | 'NEW_ANSWER'
    | 'EVIDENCE_REVEALED'
    | 'RESULTS'
    | 'ERROR';
  payload: any;
}

// Avatar types
export const AVATARS = [
  'detective',
  'businessman',
  'artist',
  'scientist',
  'chef',
  'athlete',
  'musician',
  'teacher'
] as const;

export const PLAYER_COLORS = [
  '#E63946', // red
  '#457B9D', // blue
  '#2A9D8F', // teal
  '#E9C46A', // yellow
  '#F4A261', // orange
  '#9D4EDD', // purple
  '#06FFA5', // mint
  '#FF006E'  // pink
] as const;
