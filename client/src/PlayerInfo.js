import React from 'react';
import { Textfit } from 'react-textfit';
import './PlayerInfo.css';

const PlayerInfo = ({ name, chips, chipsWon }) => {
  return (
    <div className="player-info">
      <div className="name">{name}</div>
      <div className="chips-container">
        <div className="chips">{chips}</div>
        {chipsWon > 0 && (
          <div className="chips-won">+${chipsWon}</div>
        )}
      </div>
    </div>
  );
};

export default PlayerInfo;
