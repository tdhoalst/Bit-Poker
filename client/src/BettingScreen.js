import React, { useState } from 'react';
import './BettingScreen.css'; // Make sure to create this CSS file

const BettingScreen = ({ onRaiseConfirm, onBack }) => {
  const [betAmount, setBetAmount] = useState('');

  // Example functions for betting options
  const handleMinRaise = () => setBetAmount('minRaiseAmount'); // replace with actual calculation
  const handleHalfPot = () => setBetAmount('halfPotAmount'); // replace with actual calculation
  const handleThreeQuartersPot = () => setBetAmount('threeQuartersPotAmount'); // replace with actual calculation
  const handleFullPot = () => setBetAmount('fullPotAmount'); // replace with actual calculation
  const handleAllIn = () => setBetAmount('allInAmount'); // replace with actual calculation

  return (
    <div className="betting-screen">
      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        autoFocus
      />
      <div className="betting-buttons">
        <button onClick={handleMinRaise}>MIN RAISE</button>
        <button onClick={handleHalfPot}>1/2 POT</button>
        <button onClick={handleThreeQuartersPot}>3/4 POT</button>
        <button onClick={handleFullPot}>POT</button>
        <button onClick={handleAllIn}>ALL IN</button>
      </div>
      <div className="action-buttons">
        <button onClick={() => onRaiseConfirm(betAmount)}>RAISE</button>
        <button onClick={onBack}>BACK</button>
      </div>
    </div>
  );
};

export default BettingScreen;
