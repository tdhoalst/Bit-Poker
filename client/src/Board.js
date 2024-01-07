import React from 'react';
import './Board.css'; // Make sure to create this CSS file for styling

const Board = ({ cards }) => {
  return (
    <div className="board">
      {cards.map((card, index) => (
        <img key={index} src={card.image} alt={`Card ${index}`} className="community-card" />
      ))}
    </div>
  );
};

export default Board;
