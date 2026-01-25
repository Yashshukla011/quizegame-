import React, { useState, useEffect } from 'react';
import { db, fetchQuizData } from './Firebase';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';

const MultiplePlayer = () => {
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [gameData, setGameData] = useState(null);
  const [localSelected, setLocalSelected] = useState(null);

  // Identity Fix: localStorage use karein taaki refresh pe Host change na ho
  const [userId] = useState(() => {
    let id = localStorage.getItem('battle_uid');
    if (!id) {
      id = 'U' + Math.random().toString(36).substr(2, 4).toUpperCase();
      localStorage.setItem('battle_uid', id);
    }
    return id;
  });

  const createRoom = async () => {
    if (!userName.trim()) return alert("Pehle naam likho!");
    const id = Math.random().toString(36).substring(2, 7).toUpperCase();
    try {
      const questions = await fetchQuizData();
      const roomRef = doc(db, "rooms", id);
      await setDoc(roomRef, {
        questions,
        hostId: userId,
        status: "waiting",
        currentQuestionIndex: 0,
        players: { 
          [userId]: { id: userId, score: 0, name: userName.trim().toUpperCase() + " 👑", hasAnswered: false } 
        }
      });
      setRoomId(id);
    } catch (e) { alert("Room banane mein error!"); }
  };

  const joinRoom = async () => {
    const code = inputRoomId.trim().toUpperCase();
    if (!userName.trim() || !code) return alert("Naam aur Code zaruri hai!");
    try {
      const roomRef = doc(db, "rooms", code);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return alert("Room nahi mila!");

      // FIX: Dot notation use karke player add karein taaki baki players delete na hon
      await updateDoc(roomRef, {
        [`players.${userId}`]: { 
          id: userId, 
          score: 0, 
          name: userName.trim().toUpperCase(), 
          hasAnswered: false 
        }
      });
      setRoomId(code);
    } catch (e) { alert("Join Battle button error!"); }
  };

  useEffect(() => {
    if (!roomId) return;
    // Real-time listener: Sabhi players ke liye data sync rakhta hai
    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (gameData && data.currentQuestionIndex !== gameData.currentQuestionIndex) {
        setLocalSelected(null);
      }
      setGameData(data);
    });
    return () => unsub();
  }, [roomId, gameData]);

  const handleAnswer = async (selected) => {
    if (!gameData || gameData.players[userId]?.hasAnswered) return;
    const isCorrect = selected === gameData.questions[gameData.currentQuestionIndex].correctAnswer;
    setLocalSelected(selected);
    await updateDoc(doc(db, "rooms", roomId), {
      [`players.${userId}.score`]: isCorrect ? (gameData.players[userId].score + 10) : gameData.players[userId].score,
      [`players.${userId}.hasAnswered`]: true
    });
  };

  if (!roomId) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-black mb-10 italic text-cyan-500 uppercase">Quiz Battle</h1>
        <div className="w-full max-w-xs space-y-4 bg-[#0a0a0a] p-8 rounded-3xl border border-white/5 shadow-2xl">
          <input placeholder="YOUR NAME" value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-white/10 text-center font-bold outline-none focus:border-cyan-500" />
          <button onClick={createRoom} className="w-full bg-cyan-600 p-4 rounded-xl font-black uppercase active:scale-95 transition-all shadow-lg shadow-cyan-900/20">Create Room</button>
          <div className="h-px bg-gray-900 my-2"></div>
          <input placeholder="ROOM CODE" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} className="w-full bg-black p-4 rounded-xl border border-white/10 text-center font-bold outline-none focus:border-emerald-500" />
          <button onClick={joinRoom} className="w-full bg-emerald-600 p-4 rounded-xl font-black uppercase active:scale-95 transition-all shadow-lg shadow-emerald-900/20">Join Battle</button>
        </div>
      </div>
    );
  }

  if (!gameData) return null;
  const playersArr = Object.values(gameData.players || {});

  // LOBBY SCREEN (Sahi Data Sync ke saath)
  if (gameData.status === "waiting") {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-cyan-500 text-[10px] font-black tracking-[0.5em] mb-4 uppercase">Room Code</p>
        <h1 className="text-7xl font-black mb-12 tracking-widest">{roomId}</h1>
        <div className="bg-[#080808] p-10 rounded-[50px] w-96 border border-white/5 shadow-2xl">
          <p className="text-center text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">Players Joined ({playersArr.length})</p>
          <div className="space-y-3 mb-10">
            {playersArr.map(p => (
              <div key={p.id} className="bg-[#111] p-5 rounded-2xl flex justify-between items-center border border-white/5">
                <span className="font-black italic text-lg uppercase">{p.name}</span>
                <span className="text-emerald-500 text-[9px] font-black animate-pulse">ONLINE</span>
              </div>
            ))}
          </div>
          {gameData.hostId === userId ? (
            <button onClick={() => updateDoc(doc(db,"rooms",roomId), {status: "playing"})} className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase hover:bg-cyan-400 transition-all shadow-lg text-lg">Start Battle</button>
          ) : (
            <div className="text-center italic text-gray-500 font-bold animate-bounce uppercase">Waiting for host...</div>
          )}
        </div>
      </div>
    );
  }

  // GAMEPLAY SCREEN (Leaderboard on Right side)
  const currentQ = gameData.questions[gameData.currentQuestionIndex];
  return (
    <div className="h-screen bg-black text-white flex flex-row overflow-hidden font-sans">
      <div className="flex-[3] flex flex-col items-center justify-center p-12 relative">
        <div className="absolute top-10 left-10 text-gray-800 font-black text-xs uppercase tracking-widest">Question {gameData.currentQuestionIndex + 1}/{gameData.questions.length}</div>
        <div className="w-full max-w-2xl text-center">
          <h2 className="text-4xl font-black italic mb-20 leading-tight uppercase" dangerouslySetInnerHTML={{__html: currentQ?.question}}></h2>
          <div className="grid grid-cols-2 gap-5">
            {currentQ?.options.map((opt, i) => {
              const myP = gameData.players[userId];
              const isSelected = localSelected === opt;
              const isCorrect = opt === currentQ.correctAnswer;
              let style = "bg-[#0d0d0d] border-white/5";
              if (myP?.hasAnswered) {
                if (isCorrect) style = "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_40px_-10px_#10b981]";
                else if (isSelected) style = "border-red-600 bg-red-600/20 text-red-500";
                else style = "opacity-20 grayscale border-transparent";
              }
              return (
                <button key={i} disabled={myP?.hasAnswered} onClick={() => handleAnswer(opt)}
                  className={`p-8 rounded-[24px] border-2 font-black text-left text-lg transition-all ${style}`}
                  dangerouslySetInnerHTML={{__html: opt}}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* LEADERBOARD SIDE PANEL */}
      <div className="flex-1 bg-[#050505] border-l border-white/5 p-8 flex flex-col">
        <h3 className="text-cyan-400 font-black text-2xl italic mb-10 tracking-tighter uppercase italic">Leaderboard</h3>
        <div className="space-y-4">
          {playersArr.sort((a,b) => b.score - a.score).map((p, i) => (
            <div key={p.id} className={`p-5 rounded-2xl flex items-center justify-between border ${p.id === userId ? 'bg-white/10 border-white/10' : 'bg-[#0a0a0a] border-transparent'}`}>
              <div className="flex items-center gap-4">
                <span className="text-gray-800 font-black text-xl italic">{i + 1}</span>
                <div>
                  <p className="font-black italic text-lg leading-none mb-1 uppercase">{p.name}</p>
                  <div className="flex items-center gap-2">
                    <div className={`h-1 w-10 rounded-full ${p.hasAnswered ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-gray-800'}`}></div>
                    <span className="text-[7px] font-black text-gray-600 uppercase tracking-tighter">{p.hasAnswered ? 'READY' : 'THINKING'}</span>
                  </div>
                </div>
              </div>
              <span className="text-3xl font-black italic text-cyan-400">{p.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiplePlayer;