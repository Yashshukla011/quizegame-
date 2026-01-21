import React, { useState, useEffect } from 'react';
import { db, auth, fetchQuizData } from './Firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const PvPGame = () => {
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [gameData, setGameData] = useState(null);
  const [playerNum, setPlayerNum] = useState(null); 
  const [loading, setLoading] = useState(false);


  const createRoom = async () => {
    setLoading(true);
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    const questions = await fetchQuizData();
    
    const roomRef = doc(db, "rooms", id);
    const initialData = {
      questions,
      player1: { id: auth.currentUser?.uid || 'anon1', score: 0 },
      player2: null,
      status: "waiting",
      currentQuestionIndex: 0, 
      turn: "player1"
    };

    await setDoc(roomRef, initialData);
    setRoomId(id);
    setPlayerNum(1);
    setLoading(false);
  };


  const joinRoom = async () => {
    if (!inputRoomId) return alert("Enter Room ID");
    setLoading(true);
    const roomRef = doc(db, "rooms", inputRoomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      await updateDoc(roomRef, {
        player2: { id: auth.currentUser?.uid || 'anon2', score: 0 },
        status: "playing"
      });
      setRoomId(inputRoomId);
      setPlayerNum(2);
    } else {
      alert("Room not found!");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (doc) => {
      setGameData(doc.data());
    });
    return () => unsub();
  }, [roomId]);

  
  const handleAnswer = async (selected) => {
    const myTurnKey = playerNum === 1 ? 'player1' : 'player2';
    
  
    if (gameData.turn !== myTurnKey) return; 

    const currentIdx = gameData.currentQuestionIndex;
    const currentQ = gameData.questions[currentIdx];
    const isCorrect = selected === currentQ.correctAnswer;
    
    const roomRef = doc(db, "rooms", roomId);
    const myData = playerNum === 1 ? gameData.player1 : gameData.player2;
    const nextTurn = playerNum === 1 ? 'player2' : 'player1';

    await updateDoc(roomRef, {
      [`${myTurnKey}.score`]: isCorrect ? myData.score + 10 : myData.score,
      currentQuestionIndex: currentIdx + 1, 
      turn: nextTurn 
    });
  };

 
  if (gameData?.currentQuestionIndex >= 10) {
    const p1 = gameData.player1;
    const p2 = gameData.player2;
    const winner = p1.score > p2.score ? "PLAYER 1 WINS!" : (p2.score > p1.score ? "PLAYER 2 WINS!" : "TIE!");

    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-black text-yellow-500 mb-2">GAME OVER</h1>
        <h2 className="text-2xl font-bold text-cyan-400 mb-8">{winner}</h2>
        <div className="flex gap-12 mb-10 bg-gray-900 p-8 rounded-3xl border border-gray-800">
          <div><p className="text-gray-400 text-sm">P1 SCORE</p><p className="text-5xl font-black">{p1.score}</p></div>
          <div><p className="text-gray-400 text-sm">P2 SCORE</p><p className="text-5xl font-black">{p2.score}</p></div>
        </div>
        <button onClick={() => window.location.reload()} className="bg-white text-black px-10 py-4 rounded-2xl font-bold hover:scale-105 transition">PLAY AGAIN</button>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-4xl font-black mb-8 text-cyan-400 italic">QUIZ BATTLE</h2>
        <button onClick={createRoom} className="w-full max-w-xs bg-cyan-600 p-4 rounded-xl mb-4 font-bold active:scale-95 transition">
          {loading ? "CREATING..." : "CREATE ROOM"}
        </button>
        <input 
          placeholder="ENTER ROOM ID" 
          value={inputRoomId}
          onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
          className="w-full max-w-xs bg-gray-900 border border-gray-800 p-4 rounded-xl mb-4 text-center font-bold"
        />
        <button onClick={joinRoom} className="w-full max-w-xs bg-emerald-600 p-4 rounded-xl font-bold active:scale-95 transition">JOIN ROOM</button>
      </div>
    );
  }

  if (gameData?.status === "waiting") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">Code:</p>
        <h1 className="text-6xl font-black text-cyan-400 tracking-widest">{roomId}</h1>
        <p className="mt-8 animate-pulse text-gray-400">Waiting for opponent...</p>
      </div>
    );
  }

  const isMyTurn = (playerNum === 1 && gameData?.turn === 'player1') || (playerNum === 2 && gameData?.turn === 'player2');
  const currentQuestion = gameData?.questions[gameData.currentQuestionIndex];

  return (
    <div className="h-screen bg-[#0a0a0a] text-white p-4 flex flex-col">
     
      <div className={`text-center p-3 rounded-xl font-bold mb-4 transition-all ${isMyTurn ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20' : 'bg-gray-800 opacity-50'}`}>
        {isMyTurn ? "YOUR TURN! ✅" : "WAITING FOR OPPONENT... ⏳"}
      </div>

      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-2xl border border-gray-800 mb-6">
        <div className="text-center">
          <p className="text-[10px] text-cyan-400 font-bold uppercase">P1</p>
          <p className="text-xl font-black">{gameData?.player1.score}</p>
        </div>
        <div className="h-8 w-[1px] bg-gray-800"></div>
        <div className="text-center">
          <p className="text-[10px] text-pink-400 font-bold uppercase">P2</p>
          <p className="text-xl font-black">{gameData?.player2?.score || 0}</p>
        </div>
      </div>

      {currentQuestion && (
        <div className="flex-grow flex flex-col justify-center max-w-xl mx-auto w-full">
          <h3 className="text-2xl font-bold text-center mb-10 leading-snug" dangerouslySetInnerHTML={{__html: currentQuestion.question}}></h3>
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((opt, i) => (
              <button 
                key={i} 
                disabled={!isMyTurn} // Disable clicks if not turn
                onClick={() => handleAnswer(opt)}
                className={`w-full p-5 rounded-2xl text-lg font-semibold border-2 transition-all ${
                  isMyTurn 
                  ? 'bg-gray-900 border-gray-800 hover:border-cyan-500 hover:bg-gray-800' 
                  : 'bg-gray-900/50 border-transparent opacity-40 cursor-not-allowed'
                }`}
                dangerouslySetInnerHTML={{__html: opt}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PvPGame;