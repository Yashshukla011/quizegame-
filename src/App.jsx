import { useState } from 'react';
import StartScreen from './Component/StartScreen';
import OnlineMode from './Component/OnlineMode';

function App() {
  const [screen, setScreen] = useState('start');

  return (
    <div className="bg-black min-h-screen">
      {screen === 'start' && (
        <StartScreen 
          onStartPvP={() => setScreen('online')} 
          onStartSolo={() => setScreen('solo')} 
        />
      )}
      {screen === 'online' && <OnlineMode />}
     
    </div>
  );
}

export default App;