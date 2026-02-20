import React, { useState } from 'react';

function BachelorView({ socket, gameState }) {
  const [position, setPosition] = useState(50);
  const [lockedIn, setLockedIn] = useState(false);

  const handleLockIn = () => {
    socket.emit('bachelor_guess', { position });
    setLockedIn(true);
  };

  const renderPrompt = () => {
    if (gameState.gameMode === 'CONCEPTS') {
      return (
        <div className="prompt-container">
          <div className="left-concept">{gameState.currentTopic.left}</div>
          <div className="right-concept">{gameState.currentTopic.right}</div>
        </div>
      );
    } else {
      return (
        <div className="prompt-container">
          <h3>"{gameState.currentTopic}"</h3>
          <div className="agree-disagree-labels">
            <span>Strongly Disagree</span>
            <span>Strongly Agree</span>
          </div>
        </div>
      );
    }
  };

  if (lockedIn) {
      return (
          <div className="bachelor-view">
              <h2>Answer Locked!</h2>
              <p>Waiting for teams to guess...</p>
          </div>
      )
  }

  return (
    <div className="bachelor-view">
      <h2>You are the Bachelor!</h2>
      <p>Set the dial to your truth.</p>

      {renderPrompt()}

      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(e) => setPosition(parseInt(e.target.value))}
          className="game-slider"
        />
        <div className="current-value">{position}%</div>
      </div>

      <button className="lock-btn" onClick={handleLockIn}>Lock In Answer</button>
    </div>
  );
}

export default BachelorView;
