import React from 'react';

function MainBoard({ socket, gameState }) {
  const currentPhase = gameState.currentPhase;
  const topic = gameState.currentTopic;
  const isHost = true; // MainBoard is always host view essentially, or spectator

  const handleNextRound = () => {
    socket.emit('next_round');
  };

  const renderPrompt = () => {
    if (!topic) return <div>Loading...</div>;

    if (gameState.gameMode === 'CONCEPTS') {
      return (
        <div className="board-prompt">
          <div className="concept left">{topic.left}</div>
          <div className="spectrum-line"></div>
          <div className="concept right">{topic.right}</div>
        </div>
      );
    } else {
      return (
        <div className="board-prompt">
          <h3>"{topic}"</h3>
          <div className="agree-disagree-bar">
            <span>Strongly Disagree</span>
            <div className="spectrum-line"></div>
            <span>Strongly Agree</span>
          </div>
        </div>
      );
    }
  };

  const renderSpectrum = () => {
    if (currentPhase !== 'REVEAL') return null;

    const target = gameState.targetPosition;

    return (
      <div className="spectrum-wrapper">
        <div className="spectrum-bar-container">
           <div className="spectrum-bar">
               {/* Target Zones (clipped inside bar) */}
               <div className="target-zone zone-2" style={{ left: `${target - 20}%`, width: '40%' }}></div>
               <div className="target-zone zone-3" style={{ left: `${target - 10}%`, width: '20%' }}></div>
               <div className="target-zone zone-4" style={{ left: `${target - 3}%`, width: '6%' }}></div>
           </div>

           {/* Markers (overlay on top, not clipped) */}
           <div className="marker bachelor-marker" style={{ left: `${target}%` }}>
              <div className="marker-label">Bachelor</div>
           </div>

           {/* Team Markers */}
           {Object.entries(gameState.teams).map(([name, data]) => {
               if (data.guess === null) return null;
               return (
                   <div key={name} className="marker team-marker" style={{ left: `${data.guess}%` }}>
                       <div className="marker-label">{name}</div>
                       <div className="marker-score">+{data.lastRoundPoints}</div>
                   </div>
               );
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="main-board">
      <div className="board-header">
        <h1>Mind Match</h1>
        <div className="scores">
            {Object.entries(gameState.teams).map(([name, data]) => (
                <div key={name} className="team-score">
                    {name}: {data.score}
                </div>
            ))}
        </div>
      </div>

      <div className="game-area">
        {renderPrompt()}

        {renderSpectrum()}

        <div className="status-message">
            {currentPhase === 'BACHELOR_TURN' && (
                <h2>Bachelor {gameState.players[gameState.bachelorId]?.name} is thinking...</h2>
            )}
            {currentPhase === 'TEAM_GUESS' && (
                <div>
                    <h2>Teams are discussing!</h2>
                    <p>
                        {Object.values(gameState.players).filter(p => p.hasGuessed).length} /
                        {Object.values(gameState.players).filter(p => !p.isHost && !p.isBachelor).length} players locked in.
                    </p>
                </div>
            )}
            {currentPhase === 'REVEAL' && (
                <div className="reveal-controls">
                    <h2>The Reveal!</h2>
                    <button onClick={handleNextRound} className="next-round-btn">Next Round</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default MainBoard;
