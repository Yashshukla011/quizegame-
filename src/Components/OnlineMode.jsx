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
      player1: { id: auth.currentUser?.uid || 'anon1', score: 0, hasAnswered: false },
      player2: null,
      status: "waiting",
      currentQuestionIndex: 0,
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
        player2: { id: auth.currentUser?.uid || 'anon2', score: 0, hasAnswered: false },
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
    const myKey = playerNum === 1 ? 'player1' : 'player2';
    const opponentKey = playerNum === 1 ? 'player2' : 'player1';

    if (gameData[myKey].hasAnswered) return;

    const currentIdx = gameData.currentQuestionIndex;
    const currentQ = gameData.questions[currentIdx];
    const isCorrect = selected === currentQ.correctAnswer;
    
    const roomRef = doc(db, "rooms", roomId);
    const myData = gameData[myKey];
    const opponentData = gameData[opponentKey];

    const newScore = isCorrect ? myData.score + 10 : myData.score;

 
    if (opponentData.hasAnswered) {
      await updateDoc(roomRef, {
        [`${myKey}.score`]: newScore,
        [`${myKey}.hasAnswered`]: false, 
        [`${opponentKey}.hasAnswered`]: false,
        currentQuestionIndex: currentIdx + 1
      });
    } else {
      await updateDoc(roomRef, {
        [`${myKey}.score`]: newScore,
        [`${myKey}.hasAnswered`]: true
      });
    }
  };

 
  if (gameData?.currentQuestionIndex >= 10) {
    const p1 = gameData.player1;
    const p2 = gameData.player2;
    const winner = p1.score > p2.score ? "PLAYER 1 WON!" : (p2.score > p1.score ? "PLAYER 2 WON!" : "IT'S A TIE!");

   return (
      <div className="h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="relative p-1">
          <div className="absolute -inset-1 bg-yellow-500 rounded-3xl blur opacity-25"></div>
          <div className="relative bg-[#16181a] border border-gray-800 p-10 rounded-3xl shadow-2xl">
            <h1 className="text-5xl font-black text-yellow-500 mb-2 italic tracking-tighter">FINISH LINE</h1>
            <h2 className="text-2xl font-bold text-cyan-400 mb-8 uppercase tracking-widest">{winner}</h2>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="bg-black/40 p-6 rounded-2xl border-t-2 border-cyan-500 shadow-lg shadow-cyan-500/10">
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-2">P1 Score</p>
                <p className="text-5xl font-black text-white">{p1.score}</p>
              </div>
              <div className="bg-black/40 p-6 rounded-2xl border-t-2 border-pink-500 shadow-lg shadow-pink-500/10">
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-2">P2 Score</p>
                <p className="text-5xl font-black text-white">{p2.score}</p>
              </div>
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-white text-black py-4 rounded-xl font-black hover:bg-gray-200 transition-all active:scale-95 uppercase tracking-widest">Play Again</button>
          </div>
        </div>
      </div>
    );
  }


  if (!roomId) {
    return (
      <div className="h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-200 uppercase">
            Battle<span className="text-gray-500">Zone</span>
          </h1>
          <p className="text-sm tracking-[0.5em] text-cyan-400 mt-2 uppercase font-bold">Online Multiplayer</p>
        </div>
        <div className="w-full max-w-md space-y-6">
          <button onClick={createRoom} className="w-full relative group h-[120px] transition-all duration-300 active:scale-95">
             <div className="absolute -inset-1 bg-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
             <div className="h-full relative bg-[#16181a] border border-gray-800 group-hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center transition-all">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-cyan-400 rounded-t-2xl shadow-[0_0_15px_cyan]"></div>
                <span className="text-2xl font-black uppercase tracking-widest">{loading ? "Generating..." : "Create Room"}</span>
                <p className="text-[10px] text-gray-500 mt-1 uppercase">Start a new battle and share code</p>
             </div>
          </button>
          <input placeholder="ENTER ROOM ID" value={inputRoomId} onChange={(e) => setInputRoomId(e.target.value.toUpperCase())} className="w-full bg-black border-2 border-gray-800 p-5 rounded-2xl text-center font-black text-xl text-white focus:border-emerald-500 outline-none transition-all placeholder:text-gray-700" />
          <button onClick={joinRoom} className="w-full h-[80px] bg-emerald-600 rounded-2xl font-black text-xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all uppercase">Join Arena</button>
        </div>
      </div>
    );
  }


  if (gameData?.status === "waiting") {
    return (
      <div className="h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans">
        <div className="bg-[#111] border border-gray-800 p-12 rounded-[40px] text-center shadow-2xl">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Room Code</p>
          <h1 className="text-7xl font-black text-cyan-400 tracking-[0.2em] animate-pulse">{roomId}</h1>
          <div className="mt-12 space-y-4">
             <div className="w-12 h-12 border-4 border-gray-800 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
             <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Waiting for opponent to join...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- SCREEN: GAMEPLAY ---
  const myKey = playerNum === 1 ? 'player1' : 'player2';
  const hasIAnswered = gameData?.[myKey]?.hasAnswered;
  const currentQuestion = gameData?.questions?.[gameData.currentQuestionIndex];

  return (
    <div className="h-screen bg-[#0a0a0a] text-white p-4 flex flex-col font-sans overflow-hidden">
      {/* SCORES */}
      <div className="flex-none flex justify-between items-center bg-[#111] border border-gray-800 p-4 rounded-2xl mb-4 shadow-xl">
        <div className="text-left">
          <p className="text-[10px] text-cyan-400 font-black uppercase">P1 Score</p>
          <p className="text-2xl font-black">{gameData?.player1.score}</p>
        </div>
        <div className="text-center"><span className="bg-gray-800 px-3 py-1 rounded-full text-xs font-bold">{(gameData?.currentQuestionIndex || 0) + 1}/10</span></div>
        <div className="text-right">
          <p className="text-[10px] text-pink-400 font-black uppercase">P2 Score</p>
          <p className="text-2xl font-black">{gameData?.player2?.score || 0}</p>
        </div>
      </div>

      {/* TURN BAR */}
      <div className={`flex-none text-center py-2 rounded-xl font-black mb-4 border-b-2 transition-all ${
        hasIAnswered ? 'bg-orange-900/20 border-orange-500 text-orange-400' : 'bg-emerald-900/20 border-emerald-500 text-emerald-400'
      }`}>
        {hasIAnswered ? "⏳ WAITING FOR OPPONENT..." : "⚡ YOUR TURN"}
      </div>

      {/* QUESTION BOX */}
      {currentQuestion && (
        <div className="flex-grow overflow-y-auto custom-scrollbar pb-6">
          <div className="max-w-2xl mx-auto w-full">
            <div className="relative bg-[#16181a] border border-gray-800 p-6 md:p-10 rounded-3xl shadow-2xl">
              <h3 className="text-xl md:text-3xl font-bold text-center mb-8 leading-tight text-gray-100" dangerouslySetInnerHTML={{__html: currentQuestion.question}}></h3>
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((opt, i) => (
                  <button 
                    key={i} 
                    disabled={hasIAnswered}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center ${
                      !hasIAnswered 
                      ? 'bg-black/40 border-gray-800 hover:border-cyan-500 active:scale-[0.98]' 
                      : 'bg-gray-900/20 border-transparent text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-xs font-bold ${!hasIAnswered ? 'bg-gray-800 text-cyan-400' : 'bg-gray-900'}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1" dangerouslySetInnerHTML={{__html: opt}}></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PvPGame;