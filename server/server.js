const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const { Card, Deck, Player } = require('./card.js');
const { Board, Poker } = require('./poker.js');

// Create an instance of the Express application
const app = express();

// Enable CORS middleware to allow cross-origin requests
app.use(cors());

// Create an HTTP server using Express
const server = http.createServer(app);

// Initialize Socket.io on the server
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // Allow your React frontend URL
    methods: ["GET", "POST"] // Allow only GET and POST requests
  }
});

const port = 3011; // Default port

// Connect to MongoDB with a hardcoded URI
mongoose.connect('mongodb://localhost/mypokerdatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const actionSchema = new mongoose.Schema({
  status: String,
  // Additional fields can be added here
});

const Action = mongoose.model('Action', actionSchema);

class GameState {
  constructor() {
    this.connectedPlayers = [];

    this.startingBigBlind = 20;
    this.currentBigBlind = this.startingBigBlind;

    this.currentMinBet = 0;

    this.stage = 0;
    this.isStageIncremented = false;
    this.poker = new Poker(0, 10000);
  }

  getPlayerBySocketId(socketId) {
    return this.connectedPlayers.find(player => player.socketId === socketId);
  }

  addPlayer(player) {
    this.connectedPlayers.push(player);
    this.poker.addPlayer(player);
  }

  removePlayerBySocketId(socketId) {
    this.connectedPlayers = this.connectedPlayers.filter(player => player.socketId !== socketId);
    this.poker.removePlayer(socketId);
  }

  updatePlayerStatus(socketId, action, amount) {
    let player = this.getPlayerBySocketId(socketId);
    console.log(socketId, action, amount);

    if (player) {
        player.status = action;
        if (action === 'bet' && amount) {
          player.status = action + ' ' + amount;
          player.betAmount = amount;
          if (amount > this.currentMinBet) {
              this.currentMinBet = amount;
          }
        }
    }
  }

  preFlopState() {
    try {
        this.poker.preFlop();
        for (let i = 0; i < this.connectedPlayers.length; i++) {
            const player = this.poker.players[i];
            const playerHandImages = player.hand.map(card => card.imagePath);
            const playerHandNames = player.hand.map(card => card.name);
            this.connectedPlayers[i].cardImages = playerHandImages;
            this.connectedPlayers[i].cardNames = playerHandNames;
            io.to(this.connectedPlayers[i].socketId).emit('preFlop', { playerHandImages, playerHandNames });
        }
        console.log("Emitting pre-flop");
    } catch (error) {
        console.error("Error in preFlopState:", error);
    }
  }

  flopState() {
    console.log("Emitting flop");
    this.poker.flop();
    const flopImages = this.poker.board.cards.slice(0, 3).map(card => card.imagePath);
    const flopNames = this.poker.board.cards.slice(0, 3).map(card => card.name);
    io.emit('flop', { flopImages, flopNames });
  }

  turnState() {
    this.poker.turn();
    const turnImage = this.poker.board.cards[3].imagePath;
    const turnName = this.poker.board.cards[3].name;
    io.emit('turn', { turnImage, turnName });
  }

  riverState() {
    this.poker.river();
    const riverImage = this.poker.board.cards[4].imagePath;
    const riverName = this.poker.board.cards[4].name;
    io.emit('river', { riverImage, riverName });
  }

  showdownState() {
    this.poker.evaluateHand(); 
    // io.emit('showdown', { winner, potsize });
  }

  newHandState() {
    //clear board
    //clear player hands
    //reset player status, bet amount, hasFolded
    //move list of connected players +1
    //reset stage
  }

  handleGameStage() {
    console.log("Handling game stage");
    switch (this.stage) {
        case 1:
            this.preFlopState();
            break;
        case 2:
            this.flopState();
            break;
        case 3:
            this.turnState();
            break;
        case 4:
            this.riverState();
            break;
        case 5:
            this.showdownState();
            break;
        default:
            console.log("Invalid game stage");
    }
  }
  
  playNewStage() {
    if (this.stage === 1) { //pre-flop
      let currentMaxBet = this.currentBigBlind;
    } else {
      let currentMaxBet = 0;
    }
    let lastRaiserIndex = -1;
    let currentIndex = 0;
    let firstLoop = true;

    do {
        let player = this.connectedPlayers[currentIndex];

        if (!player.hasFolded) {
            // Example: Handle player action based on their status
            switch (player.status) {
                case 'bet':
                case 'raise':
                    if (player.betAmount > currentMaxBet) {
                        currentMaxBet = player.betAmount;
                        lastRaiserIndex = currentIndex;
                        console.log(`Player ${player.socketId} raised to ${player.betAmount}`);
                        console.log('lastRaiserIndex: ' + lastRaiserIndex);
                    }
                    break;
                case 'call':
                    player.updateBetAmount(currentMaxBet);
                    break;
                case 'fold':
                    player.hasFolded = true;
                    break;
                case 'check':
                    if (currentMaxBet !== this.currentMinBet) {
                        // Force player to either call, raise or fold
                    }
                    break;
            }
        }

        currentIndex = (currentIndex + 1) % this.connectedPlayers.length;

        // In the first loop, set lastRaiserIndex to the last player
        if (firstLoop && currentIndex === 0) {
            lastRaiserIndex = this.connectedPlayers.length - 1;
            firstLoop = false;
        }
    } while (currentIndex !== lastRaiserIndex || currentMaxBet > this.currentMinBet);

    // After the round, check if all players have called the current max bet
    let allCalledOrFolded = this.connectedPlayers.every(player => 
        player.hasFolded || player.betAmount === currentMaxBet
    );

    if (allCalledOrFolded) {
        this.stage++;
        this.handleGameStage();
    } else {
        console.log("Not all players have called the current max bet");
    }
  }
}



const gameState = new GameState();

app.use(express.static('public'));
app.use(express.json());

const generateRandomName = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);
  const playerName = generateRandomName();
  const newPlayer = new Player(playerName, 5000, socket.id);

  gameState.addPlayer(newPlayer);

  // send updated playerlist to all clients
  io.emit('allPlayers', gameState.connectedPlayers);

  // Send the socket ID to the client (used to determine which hole cards to show which client)
  socket.emit('playerSocketId', socket.id);

  socket.on('action', (data) => {
    gameState.stage++;
    console.log("Game stage: " + gameState.stage);
    gameState.handleGameStage();

    //update gamestate
    gameState.updatePlayerStatus(socket.id, data.action, data.amount);
    io.emit('allPlayers', gameState.connectedPlayers);

    const broadcastData = {
      playerId: data.playerId,
      action: data.action
    };
    if (data.action === 'bet' && data.amount) {
      broadcastData.amount = data.amount;
      io.emit('betMade', data.amount);
    }
    console.log(broadcastData);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    gameState.removePlayerBySocketId(socket.id);
    io.emit('allPlayers', gameState.connectedPlayers); // io.emit sends to all clients
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
