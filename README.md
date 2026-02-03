# ALIBI — A Game of Deception

> _"In the dim glow of a single desk lamp, secrets unravel and alibis crumble."_

![Genre](https://img.shields.io/badge/Genre-Social%20Deduction-8b3a3a)
![Players](https://img.shields.io/badge/Players-4--8-d4a853)
![Platform](https://img.shields.io/badge/Platform-Web-4a6741)
![Built With](https://img.shields.io/badge/Built%20With-TypeScript-3178c6)

---

## 📖 What is ALIBI?

**ALIBI** is a multiplayer social deduction game set in a 1940s noir detective universe. One player has committed a crime—but here's the twist: **they don't know what crime they committed**. Everyone must construct alibis, face interrogation, and either find the guilty party or bluff their way to freedom.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              █████╗ ██╗     ██╗██████╗ ██╗                  │
│             ██╔══██╗██║     ██║██╔══██╗██║                  │
│             ███████║██║     ██║██████╔╝██║                  │
│             ██╔══██║██║     ██║██╔══██╗██║                  │
│             ██║  ██║███████╗██║██████╔╝██║                  │
│             ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝ ╚═╝                  │
│                                                             │
│                 ─── A GAME OF DECEPTION ───                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 The Motivation

### Why We Built This

Social deduction games like **Mafia**, **Werewolf**, and **Among Us** share a common pattern: the guilty party knows everything and must lie about specific facts. We wanted to flip this dynamic entirely.

**The Question We Asked:**

> _What if the guilty player was just as confused as everyone else?_

This creates something magical:

- **Authentic confusion** instead of rehearsed deception
- **Genuine improvisation** under pressure
- **Emergent storytelling** as alibis interweave
- **No elimination**—everyone plays the entire round

### The Inspiration

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   🎬 FILM NOIR          🎮 GAMES              📺 TV        │
│   ───────────           ─────────             ──────         │
│   • Double Indemnity    • L.A. Noire          • Columbo      │
│   • The Maltese Falcon  • Papers, Please      • True         │
│   • Chinatown           • Return of the         Detective    │
│                           Obra Dinn                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

We wanted to capture:

- The tension of interrogation rooms
- The aesthetic of yellowed case files
- The drama of accusations and revelations
- The camaraderie of group mystery-solving

---

## 🛠️ Built with JetBrains WebStorm

This entire project was developed using **JetBrains WebStorm**, which provided an exceptional development experience for our TypeScript/JavaScript stack.

### How WebStorm Helped Us

```
┌─────────────────────────────────────────────────────────────┐
│                    WEBSTORM WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │   WRITE     │───▶│   DEBUG     │───▶│   DEPLOY   │     │
│   │   CODE      │    │   & TEST    │    │   & RUN     │     │
│   └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│   • TypeScript      • Integrated       • Terminal           │
│     IntelliSense      Debugger           Integration        │
│   • Auto-imports    • Console          • Git Integration    │
│   • Refactoring       Logging          • npm Scripts        │
│                     • Hot Reload                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Key Features We Used:

| Feature                  | How It Helped                                            |
| ------------------------ | -------------------------------------------------------- |
| **TypeScript Support**   | Full type checking, auto-completion, and error detection |
| **Integrated Terminal**  | Running server and client simultaneously                 |
| **Git Integration**      | Version control with visual diff and commit history      |
| **Live Edit**            | Real-time preview of CSS changes                         |
| **npm Integration**      | One-click script execution                               |
| **Code Formatting**      | Consistent code style with Prettier                      |
| **Multi-cursor Editing** | Rapid refactoring of repeated patterns                   |
| **Find & Replace**       | Project-wide search for code updates                     |

### Project Structure in WebStorm

```
ALIBI/
├── 📁 src/
│   ├── 📄 main.ts          ← UI & Game Client
│   ├── 📄 client.ts        ← WebSocket Client
│   ├── 📄 types.ts         ← TypeScript Definitions
│   ├── 📄 crimes.ts        ← Crime Scenarios
│   ├── 📄 gameManager.ts   ← State Management
│   └── 📄 style.css        ← 1940s Noir Styling
│
├── 📁 server/
│   └── 📄 index.js         ← WebSocket Server
│
├── 📁 public/
│   └── 📁 fonts/           ← Custom Fonts
│
├── 📄 index.html           ← Entry Point
├── 📄 package.json         ← Dependencies
├── 📄 tsconfig.json        ← TypeScript Config
└── 📄 vite.config.js       ← Build Config
```

---

##  Features

### Core Gameplay

```
┌─────────────────────────────────────────────────────────────┐
│                      GAME FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│   │  SETUP   │──▶│  ALIBIS  │──▶│ INTERROGA│               │
│   │  (30s)   │   │  (2min)  │   │  TION    │                │
│   └──────────┘   └──────────┘   │  (7min)  │                │
│        │                        └────┬─────┘                │
│        │                             │                      │
│        │    ┌────────────────────────┘                      │
│        │    │                                               │
│        │    ▼                                               │
│        │  ┌──────────┐   ┌──────────┐                       │
│        │  │ ACCUSA-  │──▶│ RESULTS  │                      │
│        │  │  TIONS   │   │          │                       │
│        │  │  (2min)  │   │  (20s)   │                       │
│        │  └──────────┘   └──────────┘                       │
│        │                      │                             │
│        └──────────────────────┘                             │
│              (Next Round)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Feature List

| Feature                      | Description                                  |
| ---------------------------- | -------------------------------------------- |
| 🎭 **Information Asymmetry** | Guilty player doesn't know the crime details |
| 👥 **4-8 Players**           | Perfect for parties and gatherings           |
| ⏱️ **Timed Phases**          | Automatic progression keeps games moving     |
| 🔍 **Evidence Reveals**      | New clues appear mid-interrogation           |
| ❓ **Q&A System**            | 3 questions per player, strategic allocation |
| 🎯 **Confidence Wagers**     | Risk more points for higher rewards          |
| 📊 **Score Tracking**        | Persistent scores across rounds              |
| 🎨 **Noir Aesthetic**        | Immersive 1940s detective atmosphere         |
| 📱 **Mobile Friendly**       | Play on any device                           |
| 🌐 **Real-time Multiplayer** | WebSocket-powered synchronization            |

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│                    1940s NOIR AESTHETIC                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   COLOR PALETTE                                             │
│   ─────────────                                             │
│   ████████  Inkwell (#0a0a0c)     - Backgrounds             │
│   ████████  Smoke (#1a1a1f)       - Cards & Panels          │
│   ████████  Brass (#d4a853)       - Accents & Gold          │
│   ████████  Parchment (#f5f0e6)   - Text & Paper            │
│   ████████  Crime (#8b3a3a)       - Danger & Accusations    │
│   ████████  Alibi (#4a6741)       - Safe & Verified         │
│                                                             │
│   TYPOGRAPHY                                                │
│   ──────────                                                │
│   Headlines: Playfair Display (Serif)                       │
│   Body Text: Crimson Pro (Elegant Serif)                    │
│   Evidence:  Source Code Pro (Typewriter)                   │
│                                                             │
│   EFFECTS                                                   │
│   ───────                                                   │
│   • Venetian blind shadows                                  │
│   • Vignette darkening at edges                             │
│   • Coffee ring stains                                      │
│   • Paper texture overlays                                  │
│   • Noir silhouette avatars                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Playing ALIBI in Public Settings

ALIBI is designed for **social gatherings**—parties, game nights, team-building events, and conventions.

### Setup for Events

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC PLAY SETUP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   WHAT YOU NEED:                                            │
│   ──────────────                                            │
│                                                             │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│   │  HOST    │   │ NETWORK  │   │ PLAYERS  │               │
│   │ COMPUTER │   │  (WiFi)  │   │ PHONES/  │               │
│   │          │   │          │   │ TABLETS  │               │
│   └──────────┘   └──────────┘   └──────────┘               │
│        │              │              │                      │
│        └──────────────┴──────────────┘                      │
│                       │                                     │
│                       ▼                                     │
│              ┌──────────────┐                              │
│              │  PROJECTOR   │  (Optional)                  │
│              │  OR LARGE TV │                              │
│              └──────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Best Practices for Group Play

####  **Party Mode**

- Set up on a local network
- Project the game on a big screen
- Let players use their phones to participate
- Perfect for 4-8 players per round

####  **Team Building**

- Great ice-breaker activity
- Encourages creative thinking and communication
- Non-elimination means everyone stays engaged
- Rounds are short (10-12 minutes)

####  **Game Night**

- Run multiple rounds with rotating roles
- Keep score across sessions
- Create house rules for extra fun
- Theme nights (different crime packs)

### Quick Start for Hosts

```bash
# 1. Clone and install
git clone <repository>
cd alibi
npm install

# 2. Start the game
npm run dev:all

# 3. Share the URL
# Players join via: http://<your-ip>:5173

# 4. Create a room and share the 4-letter code
```

### Accessibility Features

- ✅ **No fast reflexes required** — Turn-based phases
- ✅ **Text-based** — Screen reader compatible
- ✅ **High contrast** — Clear noir palette
- ✅ **Mobile support** — Play on any device
- ✅ **No elimination** — Everyone plays every round

---

##  Future Plans

```
┌─────────────────────────────────────────────────────────────┐
│                      ROADMAP                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   PHASE 1 (Current)          PHASE 2                       │
│   ─────────────────          ───────                        │
│   ✅ Core gameplay           ○ More crime scenarios         │
│   ✅ Noir visual design      ○ Sound effects & music        │
│   ✅ Multiplayer support     ○ Custom avatar creator        │
│   ✅ Mobile responsive       ○ Spectator mode               │
│                                                             │
│   PHASE 3                    PHASE 4                        │
│   ───────                    ───────                        │
│   ○ Special roles            ○ Ranked matchmaking           │
│     (Witness, Lawyer)        ○ Player statistics            │
│   ○ Crime pack themes        ○ Tournament mode              │
│   ○ Private rooms            ○ Replay system                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

##  Crime Scenarios

The game includes multiple crime scenarios, each with unique evidence and atmosphere:

| Crime                      | Location        | Flavor                              |
| -------------------------- | --------------- | ----------------------------------- |
| 🎨 **Art Theft**           | Meridian Museum | Classic heist with security footage |
| 💼 **Corporate Espionage** | TechCorp HQ     | Stolen files and keycards           |
| 💎 **Jewelry Robbery**     | Luxe Jewelers   | Diamond rings and disabled alarms   |
| 🏛️ **City Hall Vandalism** | City Hall       | Spray paint and bicycles            |
| 🍝 **Restaurant Sabotage** | Bella Cucina    | Food contamination mystery          |

Each scenario includes:

- Detailed crime description
- Time and location specifics
- Multiple evidence pieces revealed throughout interrogation

---

##  Credits

**Built with passion using:**

- [JetBrains WebStorm](https://www.jetbrains.com/webstorm/) — IDE
- [TypeScript](https://www.typescriptlang.org/) — Language
- [Vite](https://vitejs.dev/) — Build Tool
- [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — Real-time Communication

**Typography:**

- Playfair Display by Claus Eggers Sørensen
- Crimson Pro by Jacques Le Bailly
- Source Code Pro by Adobe

**Inspiration:**

- Film noir cinema of the 1940s
- Classic detective fiction
- Modern social deduction games

---

##  License

This project is open source and available for personal, educational, and non-commercial use.

---

<div align="center">

**ALIBI** — _Where everyone has a story, but only one is hiding the truth._

```
     ┌─────────┐
     │  ▄███▄  │
     │ █     █ │
     │█  ● ●  █│
     │ █     █ │
     │  █████  │
     └─────────┘
    WHO DID IT?
```

</div>
