import React from 'react';
import BrandLogo from './BrandLogo';

interface HeaderProps {
  setView: (view: 'dashboard' | 'logger' | 'pantry' | 'profile' | 'cookbook' | 'dietPlan' | 'settings') => void;
  currentView: string;
  tagline: string;
}

const Header: React.FC<HeaderProps> = ({ setView, currentView, tagline }) => {
  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-zinc-900 p-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={() => setView('pantry')}
      >
        <div className="bg-zinc-950 w-11 h-11 rounded-2xl text-green-500 shadow-2xl flex items-center justify-center relative transition-all active:scale-105 border border-zinc-900 group-active:scale-95">
           <BrandLogo size="sm" className="text-green-500" />
           <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full blur-[2px] opacity-30 animate-pulse"></div>
        </div>
        <div>
          <h1 className="font-black text-xl leading-none tracking-tighter text-white">
            ElaChef
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <p className="text-[8px] text-zinc-600 font-black tracking-tight uppercase">{tagline}</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setView('settings')}
        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border touch-manipulation ${
          currentView === 'settings' 
            ? 'bg-green-500 text-black border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.25)]' 
            : 'bg-zinc-950 text-zinc-600 border-zinc-900 active:border-zinc-700'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
        <i className="fas fa-gear text-sm"></i>
      </button>
    </header>
  );
};

export default Header;