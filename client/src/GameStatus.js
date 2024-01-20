import React, { useState, useEffect, useContext } from 'react';
import SocketContext from './SocketContext'; // Import the context
import './GameStatus.css';

function GameStatus() {
  const [timeLeft, setTimeLeft] = useState(300); // Initially set to 5 minutes
  const [currentBlind, setCurrentBlind] = useState(0);
  const [nextBlind, setNextBlind] = useState(0);

  const socket = useContext(SocketContext); // Access the socket from the context

  useEffect(() => {
    const blindsUpdateHandler = (data) => {
      setCurrentBlind(data.currentBlind);
      setNextBlind(data.nextBlind);
      setTimeLeft(data.timeLeft);
      startCountdown(data.timeLeft);
    };

    socket.on('blindsUpdate', blindsUpdateHandler);

    const startCountdown = (initialTime) => {
      const intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalId); // Stop the countdown
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    };

    return () => {
      socket.off('blindsUpdate', blindsUpdateHandler);
      //socket.disconnect();
    };
  }, [socket]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-status">
      <div className="current-blind">NLH ~ {currentBlind / 2} / {currentBlind}</div>
      <div className="next-blind">NEXT BLIND: {nextBlind / 2} / {nextBlind} IN {formatTime(timeLeft)}</div>
    </div>
  );
}

export default GameStatus;
