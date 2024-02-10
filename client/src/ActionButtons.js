import React from 'react';
import './ActionButtons.css'; // Make sure to create this CSS file

const ActionButtons = ({ onCall, onRaise, onCheck, onFold, minCallAmount }) => {
  return (
    <div className="action-buttons">
      <button onClick={onRaise} className="button raise">{minCallAmount > 0 ? 'RAISE' : 'BET'}</button>
      <button onClick={onCall} className="button call">CALL {minCallAmount > 0 ? '$' + minCallAmount : ''}</button>
      <button onClick={onCheck} className="button check">CHECK</button>
      <button onClick={onFold} className="button fold">FOLD</button>
    </div>
  );
};

export default ActionButtons;
