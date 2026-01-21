import { useState } from 'react';
import StartScreen from './Component/StartScreen';
import OnlineMode from './Component/OnlineMode';
import Local from "./Component/Local"; // Make sure path is correct

function App() {
  const [screen, setScreen] = useState('start');

  return (
    <div className="bg-black min-h-screen">
      {screen === 'start' && (
        <StartScreen 
          onStartPvP={() => setScreen('online')} 
          onStartSolo={() => setScreen('pvp')} // 'Solo' button ab local pvp chalayega
        />
      )}

      {screen === 'online' && <OnlineMode onBack={() => setScreen('start')} />}
      
      {/* Offline Battle Mode */}
      {screen === 'pvp' && <Local onBack={() => setScreen('start')} />}
    </div>
  );
}

export default App;