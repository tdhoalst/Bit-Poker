import React from 'react';
import './Cards.css'; // Cards specific styles

const Cards = ({ cardImages, cardNames }) => {

  return (
    <div className="cards">
      {cardImages.map((image, index) => (
        <img 
          key={index} 
          src={image} 
          alt={cardNames[index]} 
          className={`card card-${index + 1}`} 
        />
      ))}
    </div>
  );
};

export default Cards;
