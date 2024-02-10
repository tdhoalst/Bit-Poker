import React from 'react';
import Cards from './Cards';
import PlayerInfo from './PlayerInfo';
import './Player.css';

const Player = ({ name, cardImages, cardNames, chips, chipsWon, status }) => {
  return (
    <div className="player-container">
      <div className="player">
        <Cards cardImages={cardImages} cardNames={cardNames} />
        <PlayerInfo name={name} chips={chips} chipsWon={chipsWon} />
      </div>
      <div className="player-status">{status}</div>
    </div>
  );
};

export default Player;