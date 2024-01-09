require('dotenv').config(); // Use environment variables
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

const port = process.env.PORT || 3011; // Environment variable for port

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/mypokerdatabase', {
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
    //this.userStatusMap = new Map();
    this.stage = 0;
    this.isStageIncremented = false;
    this.poker = new Poker(2, 10000);
  }

  addPlayer(player) {
    this.connectedPlayers.push(player);
  }

  getPlayerBySocketId(socketId) {
    return this.connectedPlayers.find(player => player.socketId === socketId);
  }

  removePlayerBySocketId(socketId) {
    this.connectedPlayers = this.connectedPlayers.filter(player => player.socketId !== socketId);
  }

  preFlopState() {
    console.log("Emitting pre-flop");
    try {
        this.poker.preFlop();

        this.poker.players.forEach(player => {
            const playerHandImages = player.hand.map(card => card.imagePath);
            const playerHandNames = player.hand.map(card => card.name);

            if (player.socketId && io.sockets.sockets.get(player.socketId)) {
                io.to(player.socketId).emit('preFlop', { playerHandImages, playerHandNames });
            } else {
                console.error(`Socket ID not found for player: ${player.id}`);
            }
        });
    } catch (error) {
        console.error("Error in preFlopState:", error);
    }
  }

  flopState() {
    console.log("Emitting flop");
    this.poker.preFlop();
    this.poker.flop();
    const flopImages = this.poker.board.cards.slice(0, 3).map(card => card.imagePath);
    const flopNames = this.poker.board.cards.slice(0, 3).map(card => card.name);
    io.emit('flop', { flopImages, flopNames});
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
    //reset player status
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
  
  //ADD NEW UPDATE STAGE METHOD HERE
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
  const newPlayer = {
    name: playerName,
    cardImages: [],
    cardNames: [],
    chips: 5000,
    status: '',
    socketId: socket.id,
  };

  gameState.addPlayer(newPlayer);

  // io.emit sends new player to all clients
  // socket.emit only sends to the client that just connected
  io.emit('newPlayer', newPlayer);


  // Send the socket ID to the client (used to determine which hole cards to show which client)
  socket.emit('playerSocketId', socket.id);

  // send list of conected players to client
  socket.emit('allPlayers', gameState.connectedPlayers);

  socket.on('action', (data) => {
    // Prepare the data to be broadcasted
    const broadcastData = {
      playerId: data.playerId,
      action: data.action
    };

    // If the action is a bet, include the amount in the broadcast
    if (data.action === 'bet' && data.amount) {
      broadcastData.amount = data.amount;
    }
    console.log(broadcastData);

    // socket.broadcast.emit sends to all clients except the sender
    socket.broadcast.emit('actionUpdate', broadcastData);
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
