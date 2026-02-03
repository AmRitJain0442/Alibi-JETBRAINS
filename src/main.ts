// Main entry point for Alibi - Visual Game

import { AlibiGame } from './game/AlibiGame';
import './game/game.css';

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App container not found');
    return;
  }

  // Clear loading content
  app.innerHTML = '';

  // Create and initialize the game
  const game = new AlibiGame(app);
  game.initialize();
});
