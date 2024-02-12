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

    this.pot = 0;

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

  updatePlayerChips(socketId, action, amount) {
    let player = this.getPlayerBySocketId(socketId);
    if (player) {
      let actualAmount = 0; // This will be the actual amount the player is going to bet or call with
  
      if (action === 'bet') {
        let highestChipStack = 0;
        let secondHighestChipStack = 0;
    
        // Iterate through connectedPlayers to find the highest and second highest chip stacks
        this.connectedPlayers.forEach(p => {
          const chips = p.chips;
          if (chips > highestChipStack) {
            secondHighestChipStack = highestChipStack; // Update second highest
            highestChipStack = chips; // Update highest
          } else if (chips > secondHighestChipStack) {
            secondHighestChipStack = chips; // Update second highest if greater than current second highest but less than highest
          }
        });

        // For a bet action, ensure the bet does not exceed the player's available chips
        actualAmount = Math.min(player.chips, amount, secondHighestChipStack);
        // Optionally, you might want to enforce minimum and maximum bet limits here

        console.log(secondHighestChipStack);
      } else if (action === 'call') {
        // For a call action, the amount is the currentMinBet, but ensure it doesn't exceed the player's chips
        actualAmount = Math.min(player.chips, this.currentMinBet);
      }

      console.log(`Calculated actualAmount: ${actualAmount}`);
  
      // Deduct the actualAmount from the player's chips and add it to the pot
      player.chips -= actualAmount;
      this.pot += actualAmount;
      // Assuming betAmount tracks the total amount bet by the player in the current hand
      player.betAmount += actualAmount;
  
      // Update player status with the action and the actual amount bet or called
      this.updatePlayerStatus(socketId, action, actualAmount);
      // Notify all clients about the bet made
      io.emit('betMade', actualAmount);
    }
  }   

  updatePlayerStatus(socketId, action, amount) {
    let player = this.getPlayerBySocketId(socketId);
    if (player) {
        player.status = action;
        if ((action === 'bet' || action === 'call') && amount){
          player.status = action + ' $' + amount;
        }
    }
  }

  preFlopState() {
    try {
        var emptyString = "";
        io.emit('showdown', { emptyString });
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
    const handResult = this.poker.evaluateHand();
    const { message, winner, winners } = handResult;
    if (winner) {
        winner.chipsWon = this.pot;
        io.emit('showdown', { message });
    } else if (winners && winners.length > 0) {
        const splitPotAmount = this.pot / winners.length;
        winners.forEach(winner => {
            winner.chipsWon = splitPotAmount;
        });
        io.emit('showdown', { message });
    } 
    io.emit('allPlayers', gamestate.connectedPlayers);
  }

  preNewHandState() {
    const handResult = this.poker.evaluateHand();
    const { message, winner, winners } = handResult;
    if (winner) {
      winner.chips += this.pot;
      winner.chipsWon = 0;
    } else if (winners && winners.length > 0) {
      const splitPotAmount = this.pot / winners.length;
      winners.forEach(winner => {
          winner.chips += splitPotAmount;
          winner.chipsWon = 0;
      });
  } 
    io.emit('allPlayers', gamestate.connectedPlayers);

    setTimeout(() => {
      this.newHandState();
    }, 5000);
  }
  
  newHandState() {
    console.log("New Hand State");
    for (let i = 0; i < this.connectedPlayers.length; i++) {
      this.connectedPlayers[i].cardImages = [];
      this.connectedPlayers[i].cardNames = [];
      this.connectedPlayers[i].hand = [];
      this.connectedPlayers[i].chipsWon = 0;
    }
    io.emit('allPlayers', gamestate.connectedPlayers);
    this.poker.board = new Board();
    this.poker.deck = new Deck();
    this.poker.deck.shuffle();
    this.pot = 0;
    this.currentMinBet = 0;
    this.poker.players.forEach(player => {
      player.betAmount = 0;
      player.status = '';
    });
    this.stage = 1;
    this.handleNewStage();
  }

  handleNewStage() {
    this.currentMinBet = 0;
    for (let i = 0; i < this.connectedPlayers.length; i++) {
      if (!this.connectedPlayers[i].chips == 0) {
        this.connectedPlayers[i].status = '';
        this.connectedPlayers[i].betAmount = 0;
      }
    }
    io.emit('allPlayers', gamestate.connectedPlayers);
    console.log("Handling game stage", this.stage);
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
        case 6:
            this.preNewHandState();
            break;
        case 12:
            this.newHandState();
            var emptyString = "";
            io.emit('showdown', { emptyString });
            io.emit('newHand');
        default:
            console.log("Invalid game stage");
    }
    this.checkStageUpdate(); // Check for all ins
  }

  checkStageUpdate() {
    let allCalledOrFolded = true;
    let currentIndex = 0;
    const startingIndex = 0; // Since you start checking from index 0
  
    do {
      const player = this.connectedPlayers[currentIndex];
  
      if (((player.status !== 'fold' && player.betAmount !== this.currentMinBet) && (!player.chips === 0 || this.stage == 5)) || player.status === ''){
        console.log("player status " + player.status, "playerbetamount: " + player.betAmount, "minbet: " + this.currentMinBet, "player chips: " +  player.chips);
        allCalledOrFolded = false;
        break;
      }
  
      currentIndex = (currentIndex + 1) % this.connectedPlayers.length;
    } while (currentIndex !== startingIndex);
  
    if(allCalledOrFolded) {
      console.log("All players have called or folded");
      this.stage++;
      this.handleNewStage();
    } else {
      console.log("Not all players have called or folded");
    }
  }
}

const gamestate = new GameState();

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

  gamestate.addPlayer(newPlayer);

  // send updated playerlist to all clients
  io.emit('allPlayers', gamestate.connectedPlayers);

  // Send the socket ID to the client (used to determine which hole cards to show which client)
  socket.emit('playerSocketId', socket.id);

  socket.on('action', (data) => {
   const broadcastData = {
      playerId: data.playerId,
      action: data.action
    };
    if (data.action === 'bet' && data.amount) {
      const amount = Number(data.amount); // Convert to number
      broadcastData.amount = amount;
      gamestate.updatePlayerChips(socket.id, data.action, amount);
      if (amount > gamestate.currentMinBet) {
        gamestate.currentMinBet = amount;
      }
    }
    if (data.action === 'call') {
      const callAmount = Number(gamestate.currentMinBet); // Convert to number
      broadcastData.amount = callAmount;
      gamestate.updatePlayerChips(socket.id, data.action, callAmount);
    }
    if(data.action === 'check') {
      gamestate.updatePlayerStatus(socket.id, data.action);
    }
    if(data.action === 'fold') {
      gamestate.updatePlayerStatus(socket.id, data.action);
    }
    console.log(broadcastData);
    io.emit('allPlayers', gamestate.connectedPlayers);

    gamestate.checkStageUpdate();
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    gamestate.removePlayerBySocketId(socket.id);
    io.emit('allPlayers', gamestate.connectedPlayers); // io.emit sends to all clients
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
