import React, { useState, useEffect } from 'react';
import { db, auth, fetchQuizData } from './Firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, increment } from 'firebase/firestore';

const MultiplePlayer = ({ onBack }) => {
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);

  const [userId] = useState(() => {
    const saved = localStorage.getItem('quiz_uid');
    if (saved) return saved;
    const newId = auth.currentUser?.uid || `anon_${Math.random().toString(36).substr(2, 5)}`;
    localStorage.setItem('quiz_uid', newId);
    return newId;
  });

  // 1. Create Room
  const createRoom = async () => {
    setLoading(true);
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    try {
      const questions = await fetchQuizData();
      const roomRef = doc(db, "rooms", id);
      await setDoc(roomRef, {
        questions,
        hostId: userId,
        players: { 
          [userId]: { id: userId, score: 0, name: "Host", hasAnswered: false } 
        },
        maxPlayers: parseInt(maxPlayers),
        status: "waiting",
        currentQuestionIndex: 0
      });
      setRoomId(id);
    } catch (err) { alert("Error creating room"); }
    setLoading(false);
  };

  // 2. Join Room
  const joinRoom = async () => {
    if (!inputRoomId) return alert("Enter ID");
    setLoading(true);
    try {
      const roomRef = doc(db, "rooms", inputRoomId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const data = snap.data();
        const count = Object.keys(data.players || {}).length;
        if (count >= data.maxPlayers) return alert("Room full!");
        
        await updateDoc(roomRef, {
          [`players.${userId}`]: { id: userId, score: 0, name: `Player ${count + 1}`, hasAnswered: false }
        });
        setRoomId(inputRoomId);
      } else { alert("Room not found"); }
    } catch (e) { alert("Join failed"); }
    setLoading(false);
  };

  // 3. Sync & Next Question Logic (Master Controller)
  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(doc(db, "rooms", roomId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGameData(data);

        // SYNC LOGIC: Only Host checks if round is complete
        if (data.status === "playing" && data.hostId === userId) {
          const playersArray = Object.values(data.players || {});
          const totalInRoom = playersArray.length;
          const answeredCount = playersArray.filter(p => p.hasAnswered).length;

          // Jab sabne answer de diya, tab Host agla question trigger karega
          if (answeredCount > 0 && answeredCount === totalInRoom) {
            triggerNextRound(data, playersArray);
          }
        }
      }
    });
    return () => unsub();
  }, [roomId, userId]);

  const triggerNextRound = async (data, players) => {
    const roomRef = doc(db, "rooms", roomId);
    // 10 sawal ke baad game khatam
    if (data.currentQuestionIndex >= 9) {
      await updateDoc(roomRef, { status: "finished" });
    } else {
      const updates = {
        currentQuestionIndex: increment(1)
      };
      // Sabka 'hasAnswered' reset karna zaroori hai
      players.forEach(p => {
        updates[`players.${p.id}.hasAnswered`] = false;
      });
      await updateDoc(roomRef, updates);
    }
  };

  // 4. Answer Handling
  const handleAnswer = async (selected) => {
    // Safety check: Agar data load nahi hua ya player pehle hi click kar chuka hai
    if (!gameData || !gameData.players[userId] || gameData.players[userId].hasAnswered) return;

    const currentIdx = gameData.currentQuestionIndex;
    const currentQ = gameData.questions[currentIdx];
    const isCorrect = selected === currentQ.correctAnswer;
    const roomRef = doc(db, "rooms", roomId);

    // Score update aur button lock
    await updateDoc(roomRef, {
      [`players.${userId}.score`]: isCorrect ? increment(10) : increment(0),
      [`players.${userId}.hasAnswered`]: true
    });
  };

  // --- RENDERING WITH NULL CHECKS ---

  // Loading State
  if (roomId && !gameData) {
    return <div className="h-screen bg-black flex items-center justify-center text-white font-bold">SYCHRONIZING DATA...</div>;
  }

  // WINNER SCREEN (Ab sabki screen par ek saath dikhega)
  if (gameData?.status === "finished") {
    const players = Object.values(gameData.players || {}).sort((a,b) => b.score - a.score);
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-black text-yellow-500 mb-8 italic">FINAL RANKINGS</h1>
        <div className="w-full max-w-sm space-y-4">
          {players.map((p, i) => (
            <div key={p.id} className={`p-5 rounded-2xl border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500' : 'bg-[#111] border-gray-800'} flex justify-between items-center`}>
              <span className="font-bold text-lg">{i+1}. {p.name} {p.id === userId && "(YOU)"}</span>
              <span className="text-2xl font-black">{p.score}</span>
            </div>
          ))}
        </div>
        <button onClick={onBack} className="mt-12 bg-white text-black px-12 py-4 rounded-2xl font-black">BACK TO MENU</button>
      </div>
    );
  }

  // ENTRY SCREEN
  if (!roomId) {
    return (
      <div className="h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-black mb-12 tracking-tighter">PARTY<span className="text-cyan-500">PLAY</span></h1>
        <div className="w-full max-w-xs space-y-4">
          <input type="number" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} className="w-full bg-[#111] p-4 rounded-xl border border-gray-800 text-white font-bold" placeholder="Max Players" />
          <button onClick={createRoom} className="w-full bg-cyan-600 py-4 rounded-xl font-bold uppercase">{loading ? "Wait..." : "Create Room"}</button>
          <div className="text-center text-gray-700 text-xs font-bold">OR</div>
          <input placeholder="ENTER CODE" value={inputRoomId} onChange={e => setInputRoomId(e.target.value.toUpperCase())} className="w-full bg-[#111] p-4 rounded-xl text-center font-bold border border-gray-800 focus:border-cyan-500 outline-none" />
          <button onClick={joinRoom} className="w-full bg-emerald-600 py-4 rounded-xl font-bold uppercase">Join Match</button>
          <button onClick={onBack} className="w-full text-gray-600 font-bold mt-4 text-sm">BACK</button>
        </div>
      </div>
    );
  }

  // LOBBY
  if (gameData?.status === "waiting") {
    const list = Object.values(gameData.players || {});
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="bg-[#111] border border-gray-800 p-10 rounded-[40px] text-center w-full max-w-sm">
          <p className="text-gray-500 text-xs font-black mb-2 uppercase">Lobby ID</p>
          <h1 className="text-6xl font-black text-cyan-400 mb-8 tracking-widest">{roomId}</h1>
          <div className="mb-10 space-y-2">
            {list.map(p => (
              <p key={p.id} className="text-gray-300 font-bold uppercase text-sm">✓ {p.name}</p>
            ))}
          </div>
          {gameData.hostId === userId ? (
            <button onClick={() => updateDoc(doc(db,"rooms",roomId), {status: "playing"})} className="w-full bg-white text-black py-4 rounded-xl font-black shadow-lg shadow-white/10">START GAME</button>
          ) : (
            <div className="p-4 bg-gray-900/50 rounded-xl text-xs text-gray-500 font-bold animate-pulse">WAITING FOR HOST...</div>
          )}
        </div>
      </div>
    );
  }

  // MAIN GAMEPLAY
  const myStatus = gameData?.players?.[userId];
  const q = gameData?.questions?.[gameData?.currentQuestionIndex];

  return (
    <div className="h-screen bg-black text-white p-4 flex flex-col">
      <div className="flex justify-between items-center bg-[#111] p-5 rounded-3xl border border-gray-800 mb-6">
        <div>
          <p className="text-[10px] text-gray-500 font-black uppercase">Your Score</p>
          <p className="text-3xl font-black text-white">{myStatus?.score || 0}</p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-full text-xs font-black border border-gray-700">
          Q: {(gameData?.currentQuestionIndex || 0) + 1} / 10
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-black uppercase">Status</p>
          <p className="text-xs font-black text-emerald-500 uppercase">Live Sync</p>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center max-w-2xl mx-auto w-full">
        {/* Waiting Message */}
        <div className={`p-4 rounded-2xl text-center font-black mb-8 border-b-4 transition-all ${myStatus?.hasAnswered ? 'bg-orange-900/20 border-orange-500 text-orange-500' : 'bg-cyan-900/20 border-cyan-500 text-cyan-500'}`}>
          {myStatus?.hasAnswered ? "⌛ WAITING FOR OTHER PLAYERS..." : "🔥 ACTION: CHOOSE YOUR ANSWER!"}
        </div>

        {q && (
          <div className="bg-[#111] border border-gray-800 p-8 rounded-[40px] shadow-2xl">
            <h2 className="text-2xl font-black text-center mb-10 leading-snug" dangerouslySetInnerHTML={{__html: q.question}}></h2>
            <div className="grid gap-4">
              {q.options.map((opt, i) => (
                <button 
                  key={i} 
                  disabled={myStatus?.hasAnswered}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full p-5 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${
                    myStatus?.hasAnswered 
                    ? 'opacity-20 border-gray-800' 
                    : 'border-gray-800 hover:border-cyan-500 hover:bg-cyan-500/5 active:scale-95'
                  }`}
                >
                  <span className="font-bold text-lg" dangerouslySetInnerHTML={{__html: opt}}></span>
                  {!myStatus?.hasAnswered && <div className="w-2 h-2 rounded-full bg-gray-800 group-hover:bg-cyan-500"></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Leaderboard during game */}
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          {Object.values(gameData?.players || {}).map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-[#111] px-3 py-1 rounded-full border border-gray-800">
              <div className={`w-2 h-2 rounded-full ${p.hasAnswered ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">{p.name}: {p.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiplePlayer;