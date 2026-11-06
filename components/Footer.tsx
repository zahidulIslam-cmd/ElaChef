import React from 'react';

interface FooterProps {
  setView: (view: 'dashboard' | 'logger' | 'pantry' | 'profile' | 'cookbook' | 'dietPlan') => void;
  currentView: string;
}

const Footer: React.FC<FooterProps> = ({ setView, currentView }) => {
  const navItems = [
    { id: 'dietPlan', icon: 'fa-calendar-day', label: 'Diet Plan' },
    { id: 'dashboard', icon: 'fa-heart-pulse', label: 'Wellness' },
    { id: 'pantry', icon: 'fa-kitchen-set', label: 'Kitchen', isMain: true },
    { id: 'cookbook', icon: 'fa-book-bookmark', label: 'Cookbook' },
    { id: 'profile', icon: 'fa-user-gear', label: 'Profile' },
  ];

  const handleNav = (view: any) => {
    setView(view);
  };

  return (
    <footer 
      className="absolute bottom-0 left-0 right-0 mx-auto w-full md:max-w-2xl lg:max-w-3xl bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-900 px-2 pt-3 grid grid-cols-5 items-center shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-[100] select-none" 
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
    >
      {navItems.map((item) => (
        <div key={item.id} className="flex justify-center items-center h-full">
          {item.isMain ? (
            <button 
              onPointerDown={() => handleNav('pantry')}
              className={`relative -top-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer touch-manipulation select-none active:opacity-80 ${
                currentView === 'pantry' 
                  ? 'bg-green-500 text-black scale-110 shadow-green-500/40' 
                  : 'bg-zinc-100 text-zinc-950'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <i className={`fas ${item.icon} text-xl`}></i>
              {currentView === 'pantry' && (
                <div className="absolute -bottom-1.5 w-1 h-1 bg-black rounded-full"></div>
              )}
            </button>
          ) : (
            <button 
              onPointerDown={() => handleNav(item.id as any)}
              className={`flex flex-col items-center gap-1.5 w-full py-2 cursor-pointer touch-manipulation select-none active:opacity-80 ${
                currentView === item.id ? 'text-green-500' : 'text-zinc-500'
              }`}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <div className={`transition-transform duration-200 ${currentView === item.id ? 'scale-110 -translate-y-1' : ''}`}>
                <i className={`fas ${item.icon} text-lg`}></i>
              </div>
              <span className={`text-[7px] font-black uppercase tracking-[0.15em] ${
                currentView === item.id ? 'opacity-100' : 'opacity-40'
              }`}>
                {item.label}
              </span>
              {currentView === item.id && (
                <div className="w-1 h-1 bg-green-500 rounded-full mt-0.5 animate-pulse"></div>
              )}
            </button>
          )}
        </div>
      ))}
    </footer>
  );
};

export default Footer;