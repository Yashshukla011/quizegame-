import React from 'react';
import onStartPvP from "./OnlineMode"
const StartScreen = ({ onStartPvP, onStartSolo }) => {
  return (

    <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-sans flex flex-col items-center py-10 px-4 overflow-y-auto custom-scrollbar">
      
   
      <div className="text-center mb-12 flex-none">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-gray-200">
          Imagin<span className="text-gray-500">XP</span>
        </h1>
        <p className="text-lg tracking-[0.5em] text-gray-400 mt-2 uppercase font-light">
          Quiz Battle Arena
        </p>
        <div className="flex items-center justify-center mt-6 gap-4">
          <div className="h-[1px] w-16 bg-gray-800"></div>
          <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Competitive Gaming</span>
          <div className="h-[1px] w-16 bg-gray-800"></div>
        </div>
      </div>

     
      <div className="w-full max-w-3xl flex flex-col gap-8 mb-16">
        
        <button 
          onClick={onStartPvP}
          className="relative group w-full h-[280px] transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <div className="absolute -inset-1 bg-cyan-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <div className="h-full relative bg-[#16181a] border border-gray-800 group-hover:border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center p-10 transition-all duration-300">
           
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-cyan-400 shadow-[0_0_25px_rgba(34,211,238,1)] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="text-6xl mb-4 group-hover:animate-pulse">⚔️</div>
            <h2 className="text-4xl font-black tracking-widest uppercase mb-2">PvP Mode</h2>
            <p className="text-gray-400 text-xl mb-6">Battle 1v1 against another player</p>
            <div className="h-[1px] w-full bg-gray-800/50 mb-6"></div>
            <p className="text-sm text-gray-500 tracking-[0.3em] uppercase font-bold">Each player gets their own questions</p>
          </div>
        </button>

     
        <button 
          onClick={onStartSolo}
          className="relative group w-full h-[280px] transition-all duration-300 active:scale-95 cursor-pointer"
        >
          <div className="absolute -inset-1 bg-emerald-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
          
          <div className="h-full relative bg-[#16181a] border border-gray-800 group-hover:border-emerald-500/50 rounded-2xl flex flex-col items-center justify-center p-10 transition-all duration-300">
          
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="text-6xl mb-4 group-hover:animate-bounce">🎯</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-2 text-gray-400 group-hover:text-white">Solo Mode</h2>
            <p className="text-gray-400 text-xl mb-6">Challenge yourself and beat your score</p>
            <div className="h-[1px] w-full bg-gray-800/50 mb-6"></div>
            <p className="text-sm text-gray-500 tracking-[0.3em] uppercase font-bold">Beat your own high score</p>
          </div>
        </button>

      </div>

      {/* 3. Footer Stats - Ab ye scroll karne par niche dikhega */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-3xl pb-10">
        <div className="bg-[#111] border border-gray-800/40 rounded-2xl py-8 text-center shadow-2xl">
          <span className="block text-4xl font-black text-white">50+</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Questions</span>
        </div>
        <div className="bg-[#111] border border-gray-800/40 rounded-2xl py-8 text-center">
          <span className="block text-3xl font-bold text-gray-600">LIVE</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Multiplayer</span>
        </div>
        <div className="bg-[#111] border border-gray-800/40 rounded-2xl py-8 text-center">
          <span className="block text-3xl font-bold text-gray-600 italic">INSTANT</span>
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Results</span>
        </div>
      </div>

    </div>
  );
};

export default StartScreen;