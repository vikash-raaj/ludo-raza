import React, { useState, useEffect } from 'react';
import { Player } from './src/constants/players';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import { initSounds, playSound } from './src/utils/soundManager';

type Screen = 'home' | 'game';

export default function App() {
  const [screen, setScreen]                   = useState<Screen>('home');
  const [players, setPlayers]                 = useState<Player[]>(['red', 'green', 'yellow', 'blue']);
  const [computerPlayers, setComputerPlayers] = useState<Player[]>([]);

  // Preload all audio assets so in-game playback has zero delay
  useEffect(() => {
    initSounds();
  }, []);

  if (screen === 'game') {
    return (
      <GameScreen
        players={players}
        computerPlayers={computerPlayers}
        onHome={() => setScreen('home')}
      />
    );
  }

  return (
    <HomeScreen
      onStart={(selected, computers) => {
        playSound('game_start');
        setPlayers(selected);
        setComputerPlayers(computers);
        setScreen('game');
      }}
    />
  );
}
