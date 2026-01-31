import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

// --- FIXED: Chat Box ko bahar nikaal diya taaki typing smooth chale ---
const ChatBox = ({ isChatOpen, setIsChatOpen, messages, userName, roomId }) => {
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && roomId) {
      const msgData = {
        roomId,
        sender: userName || "Player",
        text: newMessage, // Correct variable name
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit("send_message", msgData);
      setNewMessage("");
    }
  };

  return (
    <div className={`fixed bottom-24 right-6 w-80 h-[450px] bg-[#0f0f0f] border border-white/10 rounded-[32px] shadow-2xl flex flex-col z-50 transition-all duration-300 ${isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#151515] rounded-t-[32px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Live Chat</span>
        </div>
        <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((m, i) => {
          const isMe = m.sender === userName;
          const isSystem = m.sender === "System";
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSystem ? 'items-center' : ''}`}>
              {!isSystem && <span className="text-[9px] text-zinc-600 mb-1 px-1 font-bold">{isMe ? "YOU" : m.sender} • {m.time}</span>}
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed
                ${isMe ? 'bg-emerald-500 text-black rounded-tr-none' : 
                  isSystem ? 'bg-zinc-900/50 text-emerald-400 text-[10px] italic border border-emerald-500/10 py-1 px-6' : 
                  'bg-zinc-800 text-white rounded-tl-none'}`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-[#0a0a0a] rounded-b-[32px] border-t border-white/5 flex gap-2">
        <input 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type message..." 
          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/50 transition-all" 
        />
        <button type="submit" disabled={!newMessage.trim()} className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-400 transition-all">SEND</button>
      </form>
    </div>
  );
};

const MultiplePlayer = () => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [players, setPlayers] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [currentQ, setCurrentQ] = useState(null);
  const [qInfo, setQInfo] = useState({ index: 0, total: 0 });
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [userId] = useState(() => {
    let id = sessionStorage.getItem('battle_uid') || 'U-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    sessionStorage.setItem('battle_uid', id);
    return id;
  });

  useEffect(() => {
    socket.on("update_players", (data) => {
      setPlayers([...data.players].sort((a, b) => b.score - a.score));
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
      alert("Room full hai bhai!");
      setRoomId('');
    });

    socket.on("receive_message", (msgData) => {
      setMessages((prev) => [...prev, msgData]);
    });

    return () => { socket.off(); };
  }, []);

  const handleAnswer = (opt) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOption(opt);
    socket.emit("submit_answer", { roomId, userId, isCorrect: opt === currentQ.ans });
  };

  if (gameOver) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 italic mb-10 uppercase">Battle Results</h2>
        <div className="w-full max-w-md space-y-3">
          {players.map((p, i) => (
            <div key={p.userId} className={`flex justify-between items-center p-6 rounded-[24px] border ${i === 0 ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/5 bg-[#0a0a0a]'}`}>
              <span className="font-bold text-lg uppercase">{i + 1}. {p.name} {p.userId === userId && "(YOU)"}</span>
              <span className="font-black text-xl text-yellow-500">{p.score} PT</span>
            </div>
          ))}
        </div>
        <button onClick={() => window.location.reload()} className="mt-12 bg-white text-black px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all">Exit Battle</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col relative font-sans overflow-hidden">
      {/* ChatBox Component Called Here */}
      <ChatBox 
        isChatOpen={isChatOpen} 
        setIsChatOpen={setIsChatOpen} 
        messages={messages} 
        userName={userName} 
        roomId={roomId} 
      />
      
      {!roomId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
          <h1 className="text-4xl font-black italic mb-6 tracking-tighter">QUIZ BATTLE</h1>
          <input placeholder="ENTER NAME" value={userName} onChange={e => setUserName(e.target.value.toUpperCase())} className="w-full max-w-xs bg-[#0a0a0a] p-5 rounded-2xl text-center font-bold border border-white/5 outline-none focus:border-emerald-500/50" />
          
          <div className="w-full max-w-xs bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-center mb-3 font-black text-zinc-700 uppercase tracking-widest">Player Limit</p>
            <div className="flex gap-2">
              {[2, 3, 4].map(n => <button key={n} onClick={() => setMaxPlayers(n)} className={`flex-1 py-2 rounded-xl font-bold transition-all ${maxPlayers === n ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-black text-zinc-600'}`}>{n}P</button>)}
            </div>
          </div>

          <button onClick={() => { if(!userName) return alert("Pehle naam dalo!"); const rid = Math.random().toString(36).substr(2, 5).toUpperCase(); setRoomId(rid); socket.emit("join_room", { roomId: rid, userName, userId, maxPlayers }); }} 
            className="w-full max-w-xs bg-white text-black p-5 rounded-2xl font-black text-xs tracking-widest hover:bg-emerald-400 transition-all">CREATE ROOM</button>
          
          <div className="flex items-center gap-4 w-full max-w-xs py-2"><div className="h-px bg-white/5 flex-1"></div><span className="text-[10px] text-zinc-800 font-bold uppercase">OR</span><div className="h-px bg-white/5 flex-1"></div></div>
          
          <input placeholder="ROOM CODE" id="r_input" className="w-full max-w-xs bg-[#0a0a0a] p-5 rounded-2xl text-center font-bold border border-white/5 outline-none" />
          <button onClick={() => { const val = document.getElementById('r_input').value.toUpperCase(); if(!val || !userName) return alert("Details missing!"); setRoomId(val); socket.emit("join_room", { roomId: val, userName, userId }); }} 
            className="w-full max-w-xs border border-white/10 p-5 rounded-2xl font-black text-xs text-zinc-500 hover:text-white transition-all">JOIN BATTLE</button>
        </div>
      ) : currentQ ? (
        <div className="flex-1 flex flex-col">
          <div className="p-6 flex justify-between items-center">
            <span className="font-black text-emerald-500 uppercase text-xl tracking-tight">QUESTION {qInfo.index + 1}/{qInfo.total}</span>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-[#0a0a0a] p-3 rounded-full relative border border-white/5">
              💬 {messages.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-black"></span>}
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl bg-[#0a0a0a] p-10 rounded-[40px] border border-white/5 shadow-2xl">
              <h2 className="text-2xl font-bold text-center mb-10 leading-snug" dangerouslySetInnerHTML={{ __html: currentQ.q }} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ.options.map(opt => (
                  <button key={opt} disabled={hasAnswered} onClick={() => handleAnswer(opt)} 
                    className={`p-5 rounded-2xl font-bold border-2 transition-all ${selectedOption === opt ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-white/5 bg-zinc-900/50 hover:border-white/20'}`} 
                    dangerouslySetInnerHTML={{ __html: opt }} />
                ))}
              </div>
            </div>
            {hasAnswered && <p className="mt-8 text-emerald-500 animate-pulse font-black text-[10px] tracking-[4px] uppercase">Waiting for opponents...</p>}
          </div>
          <div className="p-6 flex justify-center gap-3 overflow-x-auto bg-[#0a0a0a] border-t border-white/5">
            {players.map((p, idx) => (
              <div key={p.userId} className={`min-w-[100px] p-3 rounded-xl border ${p.userId === userId ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5'}`}>
                <p className="text-[8px] font-bold text-zinc-600 uppercase">#{idx+1} {p.name}</p>
                <p className="text-sm font-black">{p.score} PT</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="absolute top-10 right-10">
             <button onClick={() => setIsChatOpen(true)} className="bg-[#0a0a0a] border border-white/5 px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-zinc-900">Chat ({messages.length})</button>
          </div>
          <p className="text-emerald-500 font-black tracking-[10px] text-[10px] mb-4 uppercase">Room Code</p>
          <h1 className="text-8xl font-black mb-12 tracking-tighter italic drop-shadow-2xl">{roomId}</h1>
          
          <div className="w-full max-w-xs space-y-3 mb-12">
            {players.map(p => (
              <div key={p.userId} className="p-5 bg-[#0a0a0a] rounded-3xl border border-white/5 flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                <span className="font-bold text-sm uppercase tracking-tight">{p.name} {p.userId === userId && "(YOU)"}</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
              </div>
            ))}
          </div>

          {players[0]?.userId === userId && (
            <button onClick={() => socket.emit("start_battle", roomId)} disabled={players.length < maxPlayers} 
              className={`w-full max-w-xs py-5 rounded-[28px] font-black uppercase text-xs tracking-[3px] transition-all shadow-2xl
              ${players.length >= maxPlayers ? 'bg-white text-black hover:bg-emerald-400 active:scale-95' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}>
              {players.length >= maxPlayers ? "START BATTLE" : `WAITING FOR ${maxPlayers - players.length} MORE`}
            </button>
          )}
          {players[0]?.userId !== userId && (
             <p className="text-zinc-600 font-bold text-[10px] tracking-widest animate-pulse uppercase">Waiting for host to start...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiplePlayer;