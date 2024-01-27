import React from 'react';
import './Board.css'; // Ensure your CSS file includes styles for the new elements

const Board = ({ cards }) => {
  // Ensure cards is an array before attempting to use map
  if (!Array.isArray(cards)) {
    return <div className="board">Loading cards...</div>;
  }

  return (
    <div className="board">
      {cards.map((card, index) => (
        <div key={index} className="card-container">
          <img src={card.image} alt={card.name} className="community-card" />
        </div>
      ))}
    </div>
  );
};

export default Board;

