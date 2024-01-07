import React from 'react';
import './Cards.css'; // Cards specific styles

const Cards = ({ cardImages }) => {
  return (
    <div className="cards">
      {cardImages.map((image, index) => (
        <img key={index} src={image} alt={`Card ${index}`} className={`card card-${index + 1}`} />
      ))}
    </div>
  );
};

export default Cards;
