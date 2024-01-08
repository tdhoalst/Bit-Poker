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
    this.connectedUsers = new Set();
    this.userStatusMap = new Map();
    this.stage = 0;
    this.isStageIncremented = false;
    this.poker = new Poker(2, 10000);
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
  
  updateStage(io) {
    const userCount = this.connectedUsers.size;

    if (userCount > 1) {
      let allSameStatus = true;
      let lastStatus = null;

      for (let userId of this.connectedUsers) {
        const userStatus = this.userStatusMap.get(userId);

        if (lastStatus === null) {
          lastStatus = userStatus;
        } else if (userStatus !== lastStatus || userStatus === 'none') {
          allSameStatus = false;
          break;
        }
      }

      if (allSameStatus) {
        if (!this.isStageIncremented) {
          this.stage++;
          io.emit('updateStage', { stage: this.stage });

          // Handle the new stage
          this.handleGameStage();

          // Reset player statuses for the new stage
          this.userStatusMap.clear();
          for (let userId of this.connectedUsers) {
            this.userStatusMap.set(userId, 'none');
          }

          this.isStageIncremented = false; // Allow for further stage incrementation
        }
      } else {
        this.isStageIncremented = false;
      }
    }
  }
}


const gameState = new GameState();

app.use(express.static('public'));
app.use(express.json());

io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`);
  gameState.connectedUsers.add(socket.id);

  // Create a new player and add it to the poker game
  //UPDATE THIS SO STARTING STACK SIZE IS NOT HARD CODED
  const newPlayer = new Player(`User ${socket.id}`, 1000, socket.id);
  gameState.poker.players.push(newPlayer);

  // Send the connected users to the client
  socket.emit('connectedUsers', Array.from(gameState.connectedUsers));

  // Send the socket ID to the client (used to determine which hole cards to show which client)
  socket.emit('playerSocketId', socket.id);

  socket.on('action', (data) => {
    console.log(`Action received: ${data.action} from ${data.playerId}`);

    // Prepare the data to be broadcasted
    const broadcastData = {
      playerId: data.playerId,
      action: data.action
    };

    // If the action is a bet, include the amount in the broadcast
    if (data.action === 'bet' && data.amount) {
      broadcastData.amount = data.amount;
    }

    // Broadcast the action (and amount, if applicable) to other clients
    socket.broadcast.emit('actionUpdate', broadcastData);
  });

  socket.on('disconnect', () => {
    onUserDisconnect(socket.id);
  });

  socket.emit('updateStage', { stage: gameState.stage });
});

function onUserDisconnect(socketId) {
  console.log(`User ${socketId} disconnected`);
  gameState.connectedUsers.delete(socketId);
  gameState.userStatusMap.delete(socketId);

  // Remove the player from the poker game
  const playerIndex = gameState.poker.players.findIndex(player => player.socketId === socketId);
  if (playerIndex > -1) {
    gameState.poker.players.splice(playerIndex, 1);
  }

  io.emit('userDisconnected', { userId: socketId });
}

async function handleAction(userId, action) {
  try {
    const newAction = new Action({ status: action });
    await newAction.save();
    gameState.userStatusMap.set(userId, action);
    io.emit('updateStatus', { userId, status: action });
    gameState.updateStage(io);
  } catch (err) {
    console.error('Error handling action:', err);
  }
}

function isValidAction(action) {
  return ['bet', 'check', 'fold'].includes(action);
}

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
