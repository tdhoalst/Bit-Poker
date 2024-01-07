import React from 'react';
import Cards from './Cards';
import PlayerInfo from './PlayerInfo';
import './Player.css';

const Player = ({ name, cardImages, chips, status }) => {
  return (
    <div className="player-container">
      <div className="player">
        <Cards cardImages={cardImages} />
        <PlayerInfo name={name} chips={chips} />
      </div>
      <div className="player-status">{status}</div>
    </div>
  );
};

export default Player;