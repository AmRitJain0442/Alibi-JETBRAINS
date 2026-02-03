# Alibi - A Social Deduction Mystery Game

A multiplayer game where one player committed a fictional crime but doesn't know what it was, and everyone must construct alibis and identify the guilty party through interrogation.

## 🎮 Game Concept

**The Twist:** The guilty player doesn't know what crime they committed and must bluff their way through interrogation without contradicting evidence they haven't seen.

### Game Flow

1. **Setup (30s)** - Players join, one is randomly selected as guilty
2. **Alibi Construction (2 min)** - All players write their alibis
3. **Interrogation (7 min)** - Players ask questions and answer them
4. **Evidence Reveals** - Clues are revealed mid-interrogation (only innocent players see them)
5. **Accusations (2 min)** - Vote on who's guilty with confidence wagers
6. **Results** - Guilty player revealed, scores calculated

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Game

You need to run both the server and client:

**Option 1: Run both at once**
```bash
npm run dev:all
```

**Option 2: Run separately**
```bash
# Terminal 1 - Start WebSocket server
npm run server

# Terminal 2 - Start client
npm run dev
```

The game will be available at `http://localhost:5173` (or the port Vite assigns)

## 🎯 How to Play

### For All Players
1. Join a room or create one
2. Wait for 4-8 players to join
3. Read the crime details (if innocent) or vague location info (if guilty)
4. Construct a convincing alibi

### For Innocent Players
- You know the crime details
- Craft an alibi that avoids suspicion
- Ask strategic questions to expose the guilty player
- Watch for evidence reveals and use them to your advantage

### For the Guilty Player
- You only know the location
- Invent a plausible alibi without knowing what to avoid
- Answer questions confidently while fishing for clues
- Try to deduce what you did based on questions asked

### Scoring
- **Innocent players:** Earn 100-300 points for correctly identifying the guilty player (based on confidence level)
- **Guilty player:** Earn 150 points for each player they fool

## 🛠 Technical Stack

- **Frontend:** TypeScript + Vite
- **Backend:** Node.js + WebSocket (ws library)
- **Styling:** Custom CSS with case file aesthetic
- **Real-time:** WebSocket for multiplayer synchronization

## 📁 Project Structure

```
src/
  ├── main.ts           # Main UI and game client
  ├── client.ts         # WebSocket client wrapper
  ├── types.ts          # TypeScript type definitions
  ├── crimes.ts         # Crime scenarios database
  ├── gameManager.ts    # Game state management
  └── style.css         # Case file aesthetic styles

server/
  └── index.js          # WebSocket server and game logic
```

## 🎨 Features

- ✅ Multiplayer (4-8 players)
- ✅ Real-time WebSocket communication
- ✅ Phase-based gameplay with automatic transitions
- ✅ Timed evidence reveals
- ✅ Q&A system with question limits
- ✅ Confidence-based voting
- ✅ Score tracking across rounds
- ✅ Case file aesthetic UI
- ✅ Mobile-friendly design

## 🔮 Future Enhancements

- [ ] More crime scenarios
- [ ] Special roles (Witness, Lawyer)
- [ ] Ranked mode with Elo ratings
- [ ] Crime pack themes (heist, mystery, espionage)
- [ ] Voice chat integration
- [ ] Replay system
- [ ] Player statistics dashboard

## 🎭 Game Tips

**For Innocent Players:**
- Craft alibis that subtly probe for information
- Ask questions that seem innocent but test specific knowledge
- Pay attention to hesitations and inconsistencies
- Use evidence reveals strategically

**For Guilty Players:**
- Stay calm and confident
- Listen carefully to questions for clues
- Keep your story simple and consistent
- Try to mirror the tone of innocent players

## 📝 License

This project is open source and available for personal and educational use.

---

**Created with ❤️ for mystery lovers and social deduction fans**
