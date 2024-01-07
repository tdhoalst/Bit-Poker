import React from 'react';
import { Textfit } from 'react-textfit';
import './PlayerInfo.css'; // Player info specific styles

const PlayerInfo = ({ name, chips }) => {
  return (
    <div className="player-info">
        <Textfit mode="single" max={20} className="player-name">
          {name}
        </Textfit>
      <div className="chips">{`$${chips}`}</div>
    </div>
  );
};

export default PlayerInfo;
