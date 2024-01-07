import React, { useState, useEffect } from 'react';
import './GameStatus.css';

function GameStatus({ startingBigBlind }) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [currentBlind, setCurrentBlind] = useState(startingBigBlind);
  const [nextBlind, setNextBlind] = useState(startingBigBlind * 2);

  useEffect(() => {
    if (timeLeft === 0) {
      // Update blinds and reset timer
      setCurrentBlind(nextBlind);
      setNextBlind(nextBlind * 2);
      setTimeLeft(300);
    } else {
      const intervalId = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [timeLeft, nextBlind]);

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
