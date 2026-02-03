# 🎮 ALIBI - Quick Start Guide

## What You Just Built

"Alibi" is a multiplayer social deduction game where:
- One player is guilty but doesn't know what crime they committed
- Everyone constructs alibis and interrogates each other
- Innocent players try to identify the guilty party
- The guilty player must bluff without knowing the crime details

## 🚀 The Game is Now Running!

**Server:** WebSocket server on port 8080 ✅  
**Client:** http://localhost:5173 ✅

## 📱 How to Play Right Now

1. **Open the game** at http://localhost:5173
2. **Click "Create Room"** to start a game lobby
3. **Share the 4-letter room code** with friends
4. **Other players join** by clicking "Join Room" and entering the code
5. **Wait for 4+ players** then click "Start Investigation"

## 🎭 Testing Solo (Development Mode)

To test the game mechanics:
1. Open http://localhost:5173 in multiple browser tabs/windows
2. Create a room in one tab
3. Join with different names in other tabs
4. Start the game once you have 4+ players

## 📋 Game Phases

1. **SETUP** (30s) - See your role and crime info
2. **ALIBI CONSTRUCTION** (2 min) - Write your alibi
3. **INTERROGATION** (7 min) - Ask questions (max 3 per player)
4. **ACCUSATIONS** (2 min) - Vote on the guilty player
5. **RESULTS** (20s) - See who was guilty and final scores

## 🎯 Current Features

✅ Full multiplayer support (4-8 players)  
✅ 5 different crime scenarios  
✅ Timed evidence reveals during interrogation  
✅ Question/answer system  
✅ Confidence-based voting (1x, 2x, 3x points)  
✅ Score tracking  
✅ Case file aesthetic UI  
✅ Mobile responsive  

## 🔧 Development Commands

```bash
# Run everything at once
npm run dev:all

# Or run separately:
npm run server  # Start WebSocket server
npm run dev     # Start frontend
```

## 💡 Tips for Your First Game

**If you're innocent:**
- Read the crime carefully
- Construct an alibi that's plausible but allows you to probe others
- Use your 3 questions wisely to expose contradictions
- Watch for evidence reveals - they're crucial clues!

**If you're guilty:**
- You only see the location, not the crime details
- Stay calm and be vague enough to cover your tracks
- Listen to questions for hints about what happened
- Answer confidently even when you're guessing

## 🎨 The Aesthetic

The game features a "case file" design with:
- Typewriter fonts (Special Elite, Courier Prime)
- Manila folder colors
- Paper texture backgrounds
- Stamp-style accents
- Film noir vibes

## 🚀 Next Steps

Want to enhance the game? Here are ideas:

1. **Add more crimes** - Edit `src/crimes.ts`
2. **Adjust timings** - Modify phase durations in `server/index.js`
3. **New roles** - Add witness, lawyer, etc.
4. **Custom themes** - Create crime pack variations
5. **Sound effects** - Add typewriter clicks, stamp sounds
6. **Animations** - Make evidence reveals more dramatic

## 🐛 Troubleshooting

**"Failed to connect to server"**
- Make sure the server is running (`npm run server`)
- Check port 8080 isn't blocked

**"Room not found"**
- Room codes are case-sensitive
- Rooms are temporary - creator must still be connected

**Game not advancing phases**
- Check browser console for errors
- Ensure server is running properly

---

## 🎉 You're Ready to Play!

Open http://localhost:5173 and start your first investigation!

**Enjoy uncovering alibis and catching criminals!** 🕵️‍♀️
