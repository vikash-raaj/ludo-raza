import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Player } from './src/constants/players';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import SnakeLadderScreen from './src/screens/SnakeLadderScreen';
import { initSounds, playSound } from './src/utils/soundManager';
import { initAds } from './src/utils/adService';

type Screen = 'home' | 'ludo' | 'snake';

export default function App() {
  const [screen, setScreen]                   = useState<Screen>('home');
  const [players, setPlayers]                 = useState<Player[]>(['red', 'green', 'yellow', 'blue']);
  const [computerPlayers, setComputerPlayers] = useState<Player[]>([]);

  useEffect(() => {
    initSounds();
    initAds();
  }, []);

  return (
    <SafeAreaProvider>
      {screen === 'ludo' ? (
        <GameScreen
          players={players}
          computerPlayers={computerPlayers}
          onHome={() => setScreen('home')}
        />
      ) : screen === 'snake' ? (
        <SnakeLadderScreen onHome={() => setScreen('home')} />
      ) : (
        <HomeScreen
          onStartLudo={(selected, computers) => {
            playSound('game_start');
            setPlayers(selected);
            setComputerPlayers(computers);
            setScreen('ludo');
          }}
          onStartSnake={() => {
            playSound('game_start');
            setScreen('snake');
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
