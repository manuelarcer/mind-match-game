import React, { useState } from 'react';

function Lobby({ socket, gameState, isHost }) {
  const [name, setName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [teamName, setTeamName] = useState('');

  const myPlayer = gameState.players[socket.id];

  const handleJoinGame = () => {
    if (name.trim()) {
      socket.emit('join_game', { name, isHost });
      setIsNameSet(true);
    }
  };

  const handleCreateTeam = () => {
    if (teamName.trim()) {
      socket.emit('create_team', { teamName });
      setTeamName('');
    }
  };

  const handleJoinTeam = (tName) => {
    socket.emit('join_team', { teamName: tName });
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  if (!isNameSet && !myPlayer) {
    return (
      <div className="lobby-container">
        <h2>Join the Game</h2>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={handleJoinGame}>Join</button>
      </div>
    );
  }

  if (isHost) {
    // This is handled by HostLobby component usually, but for simplicity
    return (
        <div className="host-controls">
            <button onClick={handleStartGame} disabled={Object.keys(gameState.players).length < 2}>Start Game</button>
        </div>
    )
  }

  return (
    <div className="lobby-container">
      <h2>Welcome, {myPlayer?.name || name}</h2>

      {!myPlayer?.team ? (
        <div className="team-selection">
          <h3>Select a Team</h3>
          <div className="existing-teams">
            {Object.keys(gameState.teams).length === 0 ? <p>No teams yet.</p> : (
                <ul>
                    {Object.keys(gameState.teams).map(tName => (
                        <li key={tName}>
                            <button onClick={() => handleJoinTeam(tName)}>Join {tName}</button>
                            <span> ({gameState.teams[tName].members.length} members)</span>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          <div className="create-team">
            <h4>Or Create New Team</h4>
            <input
              type="text"
              placeholder="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <button onClick={handleCreateTeam}>Create</button>
          </div>
        </div>
      ) : (
        <div className="waiting-room">
          <h3>You are on Team: {myPlayer.team}</h3>
          <p>Waiting for host to start...</p>
          <p>Teammates:</p>
          <ul>
            {gameState.teams[myPlayer.team].members.map(memId => {
                const mem = gameState.players[memId];
                return <li key={memId}>{mem?.name} {memId === socket.id ? "(You)" : ""}</li>
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Lobby;
