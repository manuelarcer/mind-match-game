import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HostLobby from './components/HostLobby';
import PlayerLobby from './components/PlayerLobby';
import MainBoard from './components/MainBoard';
import BachelorView from './components/BachelorView';
import TeamGuessView from './components/TeamGuessView';
import './App.css';

// Connect to the server
const socket = io('http://localhost:3001');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameState, setGameState] = useState(null);

  // Initialize isHost from URL immediately
  const [isHost, setIsHost] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('host') === 'true';
  });

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      // If we are host, identify immediately upon connection
      if (isHost) {
        socket.emit('join_game', { name: "HOST", isHost: true });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onStateUpdate(newState) {
      setGameState(newState);
      console.log("State updated:", newState);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state_update', onStateUpdate);

    // If socket is already connected when component mounts (rare but possible with hot reload)
    if (socket.connected && isHost) {
         socket.emit('join_game', { name: "HOST", isHost: true });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state_update', onStateUpdate);
    };
  }, [isHost]);

  if (!gameState) return <div className="loading">Connecting to Mind Match Server...</div>;

  // LOBBY PHASE
  if (gameState.currentPhase === 'LOBBY') {
      if (isHost) {
          return <HostLobby socket={socket} gameState={gameState} />;
      }
      return <PlayerLobby socket={socket} gameState={gameState} />;
  }

  // HOST VIEW (Main Board)
  if (isHost) {
      return <MainBoard socket={socket} gameState={gameState} />;
  }

  // PLAYER VIEW
  const myPlayer = gameState.players[socket.id];

  if (myPlayer?.isBachelor) {
      // Bachelor View
      if (gameState.currentPhase === 'BACHELOR_TURN') {
          return <BachelorView socket={socket} gameState={gameState} />;
      }
      if (gameState.currentPhase === 'REVEAL') {
          return (
              <div className="reveal-view">
                  <h2>The Reveal!</h2>
                  <p>Check the main screen to see how they did!</p>
              </div>
          );
      }
      return (
          <div className="waiting-view">
              <h2>You've locked in your answer!</h2>
              <p>Watch the teams sweat...</p>
          </div>
      );
  } else {
      // Team Member View
      if (gameState.currentPhase === 'BACHELOR_TURN') {
          return (
              <div className="waiting-view">
                  <h2>Waiting for the Bachelor...</h2>
                  {gameState.gameMode === 'CONCEPTS' ? (
                      <p>{gameState.currentTopic.left} vs {gameState.currentTopic.right}</p>
                  ) : (
                      <p>"{gameState.currentTopic}"</p>
                  )}
              </div>
          );
      }

      if (gameState.currentPhase === 'TEAM_GUESS') {
          return <TeamGuessView socket={socket} gameState={gameState} />;
      }

      // REVEAL PHASE
      if (gameState.currentPhase === 'REVEAL') {
          return (
              <div className="reveal-view">
                  <h2>The Results are In!</h2>
                  <p>Look at the main screen!</p>
                  <p>Your Team's Score: {gameState.teams[myPlayer.team].lastRoundPoints || 0}</p>
              </div>
          );
      }

      return (
        <div className="App">
            <h1>Game in Progress</h1>
            <p>Current Phase: {gameState.currentPhase}</p>
        </div>
      );
  }
}

export default App;
