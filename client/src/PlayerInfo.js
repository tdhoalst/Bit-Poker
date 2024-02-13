import React from 'react';
import { Textfit } from 'react-textfit';
import './PlayerInfo.css';

const numberWithCommas = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const PlayerInfo = ({ name, chips, chipsWon }) => {
  return (
    <div className="player-info">
      <div className="name">{name}</div>
      <div className="chips-container">
        <div className="chips">{chips}</div>
        {chipsWon > 0 && (
          <div className="chips-won">+${numberWithCommas(chipsWon)}</div>
        )}
      </div>
    </div>
  );
};

export default PlayerInfo;
