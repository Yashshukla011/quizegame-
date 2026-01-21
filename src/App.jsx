import { useState } from 'react';
import StartScreen from './Components/StartScreen';
import OnlineMode from './Components/OnlineMode';
import Local from './Components/Local';

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
