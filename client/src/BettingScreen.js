import React, { useState } from 'react';
import './BettingScreen.css'; // Make sure to create this CSS file

const BettingScreen = ({ onRaiseConfirm, onBack, pot, playerChips, minCallAmount}) => {
  const [betAmount, setBetAmount] = useState(0);

  const handleMinRaise = () => {
    console.log('Min Raise clicked');
    setBetAmount(minCallAmount + (minCallAmount *0.8));
  };
  
  const handleHalfPot = () => {
    console.log('Half Pot clicked', pot / 2);
    setBetAmount(pot / 2);
  };
  
  const handleThreeQuartersPot = () => {
    console.log('Three Quarters Pot clicked', pot * 0.75);
    setBetAmount(pot * 0.75);
  };
  
  const handleFullPot = () => {
    console.log('Full Pot clicked', pot);
    setBetAmount(pot);
  };
  
  const handleAllIn = () => {
    console.log('All In clicked', 'allInAmount');
    setBetAmount(playerChips);
  };  

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
