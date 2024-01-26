// App.js
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

import Player from './Player';
import ActionButtons from './ActionButtons';
import BettingScreen from './BettingScreen';
import GameStatus from './GameStatus';
import Board from './Board';
import './App.css';

const SOCKET_URL = "http://localhost:3011";
const socket = io(SOCKET_URL);


function App() {
  const [currentUserId, setCurrentUserId] = useState(''); // State to store the current user's socket ID (used to dislay right cards for each player)
  const currentUserIdRef = useRef(currentUserId);

  const [players, setPlayers] = useState([]);

  const [communityCards, setCommunityCards] = useState([]);

  const [isRaising, setIsRaising] = useState(false); // State to control the display of the betting screen  


  useEffect(() => {
    console.log('useeffect', players);

    currentUserIdRef.current = currentUserId;

    socket.on('connect', () => console.log('Connected to the server'));
    socket.on('connect_error', (error) => console.error('Connection Error:', error));
    socket.on('error', (error) => console.error('Socket.IO Error:', error));

    socket.on('allPlayers', (players) => {
      setPlayers(players);
    });

    socket.on('playerSocketId', (id) => {
      console.log('Received socket ID from server:', id);
      setCurrentUserId(id);
      currentUserIdRef.current = id; // Update ref immediately
    });

    socket.on('preFlop', (data) => {
      console.log("Received pre-flop");
      const { playerHandImages, playerHandNames } = data;
      console.log(playerHandImages);
      console.log(playerHandNames);
      setPlayers(currentPlayers => currentPlayers.map(player => {
        if (player.socketId === currentUserIdRef.current) {
          const updatedPlayer = {
            ...player,
            cardImages: playerHandImages, // use the updated file paths
            cardNames: playerHandNames
          };
          console.log('Updated player:', updatedPlayer); // Log the updated player object
          return updatedPlayer;
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

    return () => {
      // Disconnect event listeners
      socket.off('connect');
      socket.off('connect_error');
      socket.off('error');
      socket.off('allPlayers');
      socket.off('playerSocketId');
      socket.off('preFlop');
      socket.off('flop');
      socket.off('turn');
      socket.off('river');
    };
  }, [currentUserId, players]);
  
  // Handlers for button clicks
  const handleCall = (bet) => {
    console.log('Call');
    socket.emit('action', { action: 'call', amount: bet, playerId: currentUserId });
  };
  
  const handleCheck = () => {
    console.log('Check');
    socket.emit('action', { action: 'check', amount: 0, playerId: currentUserId });
  };

  const handleFold = () => {
    console.log('Fold');
    socket.emit('action', { action: 'fold', amount: 0, playerId: currentUserId });
  };

  const handleBetConfirm = (amount) => {
    console.log(`Raise to ${amount}`);
    socket.emit('action', { action: 'bet', amount: amount, playerId: currentUserId });
    setIsRaising(false); // Hide betting screen after confirming the bet
  };

  const handleRaise = () => {
    setIsRaising(true); // Show the betting screen
  };

  const handleBack = () => {
    setIsRaising(false); // Hide betting screen without confirming
  };

  return (
    <div className="App">
      <GameStatus startingBigBlind={20} />

      {players.map((player, index) => {
        const isCurrentPlayer = player.socketId === currentUserIdRef.current;
        console.log('player.socketId:', player.socketId);
        console.log('currentUserIdRef.current:', currentUserIdRef.current);
        console.log('isCurrentPlayer:', isCurrentPlayer);
        console.log('player.cardImages:', player.cardImages);

        return (
          <Player
            key={player.socketId}
            name={player.name}
            cardImages={isCurrentPlayer ? player.cardImages : ['/assets/card_backside.jpg', '/assets/card_backside.jpg']}
            cardNames={isCurrentPlayer ? player.cardNames : ['Card X', 'Card Y']}
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
  );
}

export default App;