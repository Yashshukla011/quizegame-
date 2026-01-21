import React from 'react';

const EndScreen = ({ players }) => {
    const playerArray = Object.values(players);
    
  
    let resultMessage = "Match Draw! 🤝";
    if (playerArray[0].score > playerArray[1].score) {
        resultMessage = "🏆 Player 1 Wins!";
    } else if (playerArray[1].score > playerArray[0].score) {
        resultMessage = "🏆 Player 2 Wins!";
    }

    return (
        <div style={{ textAlign: 'center', padding: '50px', background: '#1e1e1e', color: 'white', borderRadius: '15px' }}>
            <h1 style={{ color: '#00ff00' }}>GAME OVER</h1>
            <h2>{resultMessage}</h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '30px 0' }}>
                {playerArray.map((p, i) => (
                    <div key={i} style={{ border: '1px solid #444', padding: '20px', borderRadius: '10px' }}>
                        <p>Player {i + 1}</p>
                        <h3>{p.score} Points</h3>
                    </div>
                ))}
            </div>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                Play Again
            </button>
        </div>
    );
};

export default EndScreen;