import React from 'react';
import './PokerTable.css';

const PokerTable = (props) => {
  return (
    <div className="poker-table">
      {props.children} {/* This will render any children passed to PokerTable */}
    </div>
  );
};

export default PokerTable;
