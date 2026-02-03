// WebSocket Client for Alibi

export class GameClient {
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  private roomCode: string | null = null;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();

  constructor(private serverUrl: string = 'ws://localhost:8080') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to server');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'CONNECTED') {
          this.playerId = message.payload.playerId;
          resolve();
        }

        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message.payload);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from server');
      };
    });
  }

  on(messageType: string, handler: (payload: any) => void) {
    this.messageHandlers.set(messageType, handler);
  }

  send(type: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  createRoom() {
    this.send('CREATE_ROOM');
  }

  joinRoom(roomCode: string, playerName: string) {
    this.roomCode = roomCode;
    this.send('JOIN_ROOM', { roomCode, playerName });
  }

  startGame() {
    this.send('START_GAME');
  }

  submitAlibi(alibi: string) {
    this.send('SUBMIT_ALIBI', { alibi });
  }

  askQuestion(toId: string, question: string) {
    this.send('ASK_QUESTION', { toId, question });
  }

  answerQuestion(questionId: string, answer: string) {
    this.send('ANSWER_QUESTION', { questionId, answer });
  }

  submitVote(suspectId: string, confidence: number) {
    this.send('SUBMIT_VOTE', { suspectId, confidence });
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
