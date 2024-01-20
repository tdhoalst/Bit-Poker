// App.js
import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import SocketContext from './SocketContext';

import Player from './Player';
import ActionButtons from './ActionButtons';
import BettingScreen from './BettingScreen';
import GameStatus from './GameStatus';
import Board from './Board';
import './App.css';

//const SOCKET_URL = "http://localhost:3011";

function App() {
  const [currentUserId, setCurrentUserId] = useState(''); // State to store the current user's socket ID (used to dislay right cards for each player)
 
  const [players, setPlayers] = useState([
    /*
    {
      name: 'LuckBox',
      cardImages: [
        process.env.PUBLIC_URL + '/assets/spades_king.png',
        process.env.PUBLIC_URL + '/assets/spades_ace.png'
      ],
      cardNames: ['King of Spades', 'Ace of Spades'],
      chips: '3,025',
      status: 'All in',
      socketId: ''
    }
    */
  ]);

  //const [timeLeft, setTimeLeft] = useState(300);
  //const [currentBlind, setCurrentBlind] = useState(0);

  const [communityCards, setCommunityCards] = useState([]);

  const [isRaising, setIsRaising] = useState(false); // State to control the display of the betting screen

  const socket = useMemo(() => io('http://localhost:3011'), []);

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to the server'));
    socket.on('connect_error', (error) => console.error('Connection Error:', error));
    socket.on('error', (error) => console.error('Socket.IO Error:', error));

    /*
    socket.on('newPlayer', (newPlayer) => {
      setPlayers(currentPlayers => [...currentPlayers, newPlayer]);
    });
    */

    socket.on('allPlayers', (players) => {
      console.log("Received all players");
      setPlayers(players);
    });

    socket.on('playerSocketId', (id) => {
      setCurrentUserId(id);
    });

    socket.on('preFlop', (data) => {
      console.log("Received pre-flop");
      const { playerHandImages, playerHandNames } = data;
    
      setPlayers(currentPlayers => currentPlayers.map(player => {
        if (player.socketId === currentUserId) {
          return {
            ...player,
            cardImages: playerHandImages,
            cardNames: playerHandNames
          };
        }
        return player;
      }));
    });    

    socket.on('flop', (data) => {
      const { flopImages } = data;
      const updatedCards = flopImages.map(image => ({ image }));
      setCommunityCards(existingCards => [...existingCards, ...updatedCards]);
    });

    socket.on('turn', (data) => {
      const { turnImage } = data;
      setCommunityCards(existingCards => [...existingCards, { image: turnImage }]);
    });
  
    socket.on('river', (data) => {
      const { riverImage } = data;
      setCommunityCards(existingCards => [...existingCards, { image: riverImage }]);
    });

    socket.on('actionUpdate', (data) => {
      const { playerId, action, amount } = data;
      console.log(playerId, action, amount);
      if (action === 'bet' && amount) {
        updatePlayerStatus(playerId, `Bet ${amount}`);
      } else {
        updatePlayerStatus(playerId, action);
      }
    });   

    return () => {
      // Disconnect event listeners
      socket.off('connect');
      socket.off('connect_error');
      socket.off('error');
      //socket.off('newPlayer');
      socket.off('allPlayers');
      socket.off('playerSocketId');
      socket.off('preFlop');
      socket.off('flop');
      socket.off('turn');
      socket.off('river');

      socket.off('actionUpdate');
      socket.off('disconnect');
      
      //socket.off('blindsUpdate');
      //socket.disconnect();
    };
  }, [socket]);

  const updatePlayerStatus = (playerId, status) => {
    setPlayers(currentPlayers => currentPlayers.map(player => {
      if (player.socketId === playerId) {
        return { ...player, status: status };
      }
      return player;
    }));
  }; 
  
  // Handlers for button clicks
  const handleCall = () => {
    console.log('Call');
    socket.emit('action', { action: 'call', playerId: currentUserId });
    updatePlayerStatus(currentUserId, 'Call');
  };
  
  const handleCheck = () => {
    console.log('Check');
    socket.emit('action', { action: 'check', playerId: currentUserId });
    updatePlayerStatus(currentUserId, 'Check');
  };

  const handleFold = () => {
    console.log('Fold');
    socket.emit('action', { action: 'fold', playerId: currentUserId });
    updatePlayerStatus(currentUserId, 'Fold');
  };

  const handleBetConfirm = (amount) => {
    console.log(`Raise to ${amount}`);
    socket.emit('action', { action: 'bet', amount: amount, playerId: currentUserId });
    updatePlayerStatus(currentUserId, 'Bet ' + amount);
    setIsRaising(false); // Hide betting screen after confirming the bet
  };

  const handleRaise = () => {
    setIsRaising(true); // Show the betting screen
  };

  const handleBack = () => {
    setIsRaising(false); // Hide betting screen without confirming
  };

  return (
    <SocketContext.Provider value={socket}>
      <div className="App">
        <GameStatus startingBigBlind={20} />

        {players.map((player, index) => {
          const isCurrentPlayer = player.socketId === currentUserId;

          return (
            <Player
              key={player.socketId}
              name={player.name}
              cardImages={isCurrentPlayer ? player.cardImages : [process.env.PUBLIC_URL + '/assets/card_backside.jpg', process.env.PUBLIC_URL + '/assets/card_backside.jpg']}
              chips={player.chips}
              status={player.status}
            />
          );
        })}

        <Board cards={communityCards} />

        {!isRaising && (
          <ActionButtons
            onRaise={handleRaise}
            onCall={handleCall}
            onCheck={handleCheck}
            onFold={handleFold}
          />
        )}

        {isRaising && (
          <BettingScreen
            onRaiseConfirm={handleBetConfirm}
            onBack={handleBack}
          />
        )}
      </div>
    </SocketContext.Provider>
  );
}

export default App;