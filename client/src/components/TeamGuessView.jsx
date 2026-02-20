import React, { useState } from 'react';

function TeamGuessView({ socket, gameState }) {
  const [position, setPosition] = useState(50);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleLockIn = () => {
    socket.emit('submit_guess', { position });
    setHasSubmitted(true);
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

  if (hasSubmitted) {
      return (
          <div className="team-guess-view">
              <h2>Answer Locked!</h2>
              <p>You guessed: {position}%</p>
              <p>Waiting for other teammates/teams...</p>
          </div>
      )
  }

  return (
    <div className="team-guess-view">
      <h2>Team Guessing Phase</h2>
      <p>Discuss with your team and lock in your individual guess!</p>

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

export default TeamGuessView;
