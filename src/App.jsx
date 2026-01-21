import { useState } from 'react';
import StartScreen from './components/StartScreen';
import OnlineMode from './components/OnlineMode';
import Local from './components/Local';

function App() {
  const [screen, setScreen] = useState('start');

  return (
    <div className="bg-black min-h-screen">
      {screen === 'start' && (
        <StartScreen
          onStartPvP={() => setScreen('online')}
          onStartSolo={() => setScreen('pvp')}
        />
      )}

      {screen === 'online' && <OnlineMode onBack={() => setScreen('start')} />}
      {screen === 'pvp' && <Local onBack={() => setScreen('start')} />}
    </div>
  );
}

export default App;
