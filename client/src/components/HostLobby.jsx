import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

function HostLobby({ socket, gameState }) {
  const joinUrl = window.location.href.split('?')[0]; // Remove ?host=true

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  return (
    <div className="host-lobby">
      <h1>Mind Match Game</h1>
      <h2>Join at: {joinUrl}</h2>

      <div className="qr-section">
        <QRCodeCanvas value={joinUrl} size={256} />
      </div>

      <div className="players-list">
        <h3>Connected Players: {Object.keys(gameState.players).length}</h3>

        <div className="teams-container">
            {Object.keys(gameState.teams).length === 0 ? <p>Waiting for teams to form...</p> : (
                <div className="teams-grid">
                    {Object.entries(gameState.teams).map(([teamName, teamData]) => (
                        <div key={teamName} className="team-card">
                            <h3>{teamName} ({teamData.score} pts)</h3>
                            <ul>
                                {teamData.members.map(memId => {
                                    const player = gameState.players[memId];
                                    return <li key={memId}>
                                        {player?.name}
                                        {player?.isBachelor ? " 🌹 (Bachelor)" : ""}
                                    </li>
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="unassigned-players">
            <h3>Unassigned Players</h3>
            {Object.values(gameState.players).filter(p => !p.team && !p.isHost).length === 0 ? <p>None</p> : (
                <ul>
                    {Object.values(gameState.players).filter(p => !p.team && !p.isHost).map(p => (
                        <li key={p.id}>{p.name}</li>
                    ))}
                </ul>
            )}
        </div>
      </div>

      <div className="controls">
        <button
            className="start-btn"
            onClick={handleStartGame}
            disabled={Object.keys(gameState.players).length < 2 || Object.keys(gameState.teams).length < 1}
        >
            Start Game
        </button>
        {Object.keys(gameState.players).length < 2 && <p>Need at least 2 players.</p>}
        {Object.keys(gameState.teams).length < 1 && <p>Need at least 1 team.</p>}
      </div>
    </div>
  );
}

export default HostLobby;
