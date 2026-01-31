import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const MultiplePlayer = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(2); // Default 2 players
  const [currentQ, setCurrentQ] = useState(null);
  const [qInfo, setQInfo] = useState({ index: 0, total: 0 });
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  
  const [userId] = useState(() => {
    let id = sessionStorage.getItem('battle_uid') || 'U-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    sessionStorage.setItem('battle_uid', id);
    return id;
  });

  useEffect(() => {
    // Backend se players aur maxPlayers ki limit dono aayegi
    socket.on("update_players", (data) => {
      const sorted = [...data.players].sort((a, b) => b.score - a.score);
      setPlayers(sorted);
      if (data.maxPlayers) setMaxPlayers(data.maxPlayers);
    });
    
    socket.on("next_question", (data) => {
      setQInfo({ index: data.index, total: data.total });
      setCurrentQ(data.question);
      setHasAnswered(false);
      setSelectedOption(null);
    });

    socket.on("game_over", (finalList) => {
      setPlayers(finalList.sort((a, b) => b.score - a.score));
      setGameOver(true);
    });

    socket.on("room_full", () => {
      alert("Bhai, room full ho gaya hai!");
      setRoomId('');
    });

    return () => { socket.off(); };
  }, []);

  const handleAnswer = (option) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOption(option);
    const isCorrect = option === currentQ.ans;
    socket.emit("submit_answer", { roomId, userId, isCorrect });
  };

  const isHost = players[0]?.userId === userId;
  const isRoomReady = players.length === parseInt(maxPlayers);

  // --- 1. GAME OVER / FINAL RANKING ---
  if (gameOver) {
    return (
      <div className="h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 italic uppercase mb-8">Battle Results</h2>
        <div className="w-full max-w-md space-y-3">
          {players.map((p, i) => (
            <div key={p.userId} className={`flex justify-between items-center p-6 rounded-3xl border ${i === 0 ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-[#0a0a0a]'}`}>
              <span className="font-bold text-lg uppercase">{i + 1}. {p.name}</span>
              <span className="font-black text-xl text-yellow-500">{p.score} PT</span>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="mt-12 bg-white text-black px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Exit</button>
      </div>
    );
  }

  // --- 2. QUESTION SCREEN WITH LIVE SCORE ---
  if (currentQ) {
    return (
      <div className="h-screen bg-black text-white flex flex-col font-sans">
        <div className="p-6 flex justify-between items-center">
            <span className="text-[20px] font-black text-emerald-500 tracking-[3px]  ">QUESTION {qInfo.index + 1}/{qInfo.total}</span>
            <span className="font-mono text-gray-500">{roomId}</span>
        </div>

        <div className="flex-1 px-6 flex flex-col justify-center items-center">
            <div className="w-full max-w-2xl bg-[#0a0a0a] p-8 rounded-[40px] border border-white/5 shadow-2xl">
                <h2 className="text-2xl font-bold mb-10 text-center" dangerouslySetInnerHTML={{ __html: currentQ.q }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQ.options.map((opt) => (
                        <button key={opt} disabled={hasAnswered} onClick={() => handleAnswer(opt)}
                            className={`p-5 rounded-2xl font-bold border-2 transition-all 
                            ${selectedOption === opt ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-white/5 bg-[#111] hover:border-white/20'}`}
                            dangerouslySetInnerHTML={{ __html: opt }}
                        />
                    ))}
                </div>
            </div>
            {hasAnswered && <p className="mt-8 text-emerald-500 animate-pulse font-black text-[10px] tracking-[4px]">WAITING FOR OTHERS...</p>}
        </div>

        {/* Real-time Standings at Bottom */}
        <div className="bg-[#0a0a0a] border-t border-white/10 p-6 flex justify-center gap-4 overflow-x-auto">
            {players.map((p, idx) => (
                <div key={p.userId} className={`min-w-[100px] p-3 rounded-xl border ${p.userId === userId ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5'}`}>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">#{idx+1} {p.name}</p>
                    <p className="text-sm font-black">{p.score} PT</p>
                </div>
            ))}
        </div>
      </div>
    );
  }

  // --- 3. LOBBY UI (Host decided player limit) ---
  if (roomId) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-7xl font-black mb-12 tracking-tighter italic">{roomId}</h1>
        <div className="bg-[#0a0a0a] p-10 rounded-[45px] w-full max-w-[380px] border border-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[3px]">Status</p>
            <span className="text-emerald-500 font-bold text-xs">{players.length} / {maxPlayers}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(players.length / maxPlayers) * 100}%` }}></div>
          </div>

          <div className="space-y-3 mb-10">
            {players.map(p => (
              <div key={p.userId} className="bg-black p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <span className="font-bold text-sm uppercase">{p.name} {p.userId === userId && "(YOU)"}</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            ))}
            {/* Empty Slots */}
            {[...Array(maxPlayers - players.length)].map((_, i) => (
                <div key={i} className="bg-transparent p-4 rounded-2xl border border-dashed border-white/5 flex justify-center">
                    <span className="text-[10px] text-zinc-800 font-bold uppercase tracking-widest">Waiting...</span>
                </div>
            ))}
          </div>

          <button 
            disabled={!isHost || !isRoomReady}
            onClick={() => socket.emit("start_battle", roomId)}
            className={`w-full py-5 rounded-[25px] font-black uppercase text-xs tracking-[3px] transition-all
              ${isHost && isRoomReady ? 'bg-white text-black active:scale-95 shadow-xl' : 'bg-[#151515] text-zinc-800'}`}
          >
            {isHost ? (isRoomReady ? "START BATTLE" : `WAIT FOR ${maxPlayers} PLAYERS`) : "WAITING FOR HOST"}
          </button>
        </div>
      </div>
    );
  }

  // --- 4. LOGIN / CREATE ROOM SCREEN ---
  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-10">
        <div className="w-full max-w-xs space-y-4">
            <input placeholder="ENTER NAME" onChange={e => setUserName(e.target.value.toUpperCase())} className="w-full bg-[#0a0a0a] p-5 rounded-2xl text-center font-bold outline-none border border-white/5 focus:border-emerald-500/50 transition-all" />
            
            <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] font-black text-gray-700 text-center mb-3 uppercase tracking-widest">Set Player Limit</p>
                <div className="flex gap-2">
                    {[2, 3, 4].map(n => (
                        <button key={n} onClick={() => setMaxPlayers(n)} className={`flex-1 py-2 rounded-xl font-bold transition-all ${maxPlayers === n ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b98155]' : 'bg-black text-gray-600'}`}>{n}P</button>
                    ))}
                </div>
            </div>

            <button onClick={() => {
                if(!userName) return alert("Pehle naam likho!");
                const rid = Math.random().toString(36).substr(2, 5).toUpperCase();
                setRoomId(rid);
                socket.emit("join_room", { roomId: rid, userName, userId, maxPlayers });
            }} className="w-full bg-white text-black p-5 rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-400">CREATE ROOM</button>
            
            <div className="flex items-center gap-3 py-2"><div className="h-px bg-white/5 flex-1"></div><span className="text-[10px] text-zinc-800 font-bold uppercase">OR</span><div className="h-px bg-white/5 flex-1"></div></div>
            
            <input placeholder="ROOM CODE" id="r_input" className="w-full bg-[#0a0a0a] p-5 rounded-2xl text-center font-bold outline-none border border-white/5" />
            <button onClick={() => {
                const val = document.getElementById('r_input').value.toUpperCase();
                if(!val) return;
                setRoomId(val);
                socket.emit("join_room", { roomId: val, userName, userId });
            }} className="w-full bg-[#0a0a0a] text-white p-5 rounded-2xl font-black text-xs tracking-widest border border-white/10">JOIN BATTLE</button>
        </div>
    </div>
  );
};

export default MultiplePlayer;