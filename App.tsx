import React, { useState } from 'react';
import { Player } from './src/constants/players';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

type Screen = 'home' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [players, setPlayers] = useState<Player[]>(['red', 'green', 'yellow', 'blue']);

  if (screen === 'game') {
    return (
      <GameScreen
        players={players}
        onHome={() => setScreen('home')}
      />
    );
  }

  return (
    <HomeScreen
      onStart={(selected) => {
        setPlayers(selected);
        setScreen('game');
      }}
    />
  );
}
