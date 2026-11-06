import React from 'react';

interface InstructionsViewProps {
  onBack: () => void;
}

const InstructionsView: React.FC<InstructionsViewProps> = ({ onBack }) => {
  const steps = [
    {
      icon: 'fa-camera-retro',
      color: 'text-blue-400',
      glow: 'shadow-blue-500/10',
      title: '1. Scan Your Fridge',
      desc: 'Snap a photo of your groceries. Our AI identifies staples like lentils, rice, vegetables, and even regional Bangladeshi items instantly.'
    },
    {
      icon: 'fa-clipboard-list',
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
      title: '2. Manage Inventory',
      desc: 'Verify the items in your "Kitchen" tab. Add quantities to help the AI understand exactly how much food you have to work with.'
    },
    {
      icon: 'fa-fire-burner',
      color: 'text-orange-400',
      glow: 'shadow-orange-500/10',
      title: '3. Generate Recipes',
      desc: 'Hit "Generate Zero-Trip Recipe". The AI Chef builds a meal using ONLY what you currently have—no store visits required.'
    },
    {
      icon: 'fa-shuffle',
      color: 'text-purple-400',
      glow: 'shadow-purple-500/10',
      title: '4. Smart Substitutes',
      desc: 'Missing an ingredient? The AI suggests local alternatives (like using Mustard Oil instead of Ghee) or links you to Chaldal/Pandamart.'
    },
    {
      icon: 'fa-chart-simple',
      color: 'text-rose-400',
      glow: 'shadow-rose-500/10',
      title: '5. Track Wellness',
      desc: 'Log your finished meals. Use "Food Vision" to scan a plate and automatically track your calories and macros against your daily goals.'
    }
  ];

  return (
    <div className="p-6 space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-800 active:scale-90 transition-transform touch-manipulation" style={{ touchAction: 'manipulation' }}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">User Guide</h2>
          <p className="text-zinc-500 text-sm italic">Master the zero-trip lifestyle.</p>
        </div>
      </header>

      <div className="relative space-y-12 pl-4">
        {/* Progress Line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-800"></div>

        {steps.map((step, idx) => (
          <div key={idx} className="relative flex gap-6 group">
            <div className="z-10 bg-black w-7 h-7 rounded-full border-2 border-zinc-800 flex items-center justify-center text-zinc-500 active:border-zinc-400 transition-colors">
              <span className="text-[10px] font-black">{idx + 1}</span>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-[2rem] flex-1 space-y-4 active:border-zinc-800 transition-all shadow-xl">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center ${step.color} border border-zinc-800 shadow-2xl ${step.glow}`}>
                  <i className={`fas ${step.icon} text-xl`}></i>
                </div>
                <h3 className="font-black text-zinc-100 text-sm uppercase tracking-wider leading-tight">{step.title}</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6 space-y-4">
        <div className="flex items-center gap-3 text-rose-500">
          <i className="fas fa-exclamation-circle text-lg"></i>
          <h4 className="font-black text-xs uppercase tracking-widest">Troubleshooting: AI Not Working?</h4>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
          If you see a <span className="text-rose-400 font-bold">403 Forbidden</span> error, it means your API key is missing.
        </p>
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900 space-y-3">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">How to fix:</p>
          <ol className="text-[10px] text-zinc-500 space-y-2 list-decimal pl-4 font-medium">
            <li>Look at the <span className="text-zinc-100">AI Studio Build</span> sidebar (where you chat with the AI).</li>
            <li>Click on the <span className="text-zinc-100 font-bold italic">"Secrets"</span> or <span className="text-zinc-100 font-bold italic">"API Keys"</span> icon.</li>
            <li>Add a new secret with the name <code className="bg-zinc-900 px-1 rounded text-zinc-100">GEMINI_API_KEY</code>.</li>
            <li>Paste your Gemini API key as the value.</li>
          </ol>
        </div>
      </div>

      <div className="pt-6">
        <button 
          onClick={onBack}
          className="w-full bg-zinc-100 text-zinc-950 font-black py-5 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 active:scale-98 transition-all touch-manipulation"
          style={{ touchAction: 'manipulation' }}
        >
          <i className="fas fa-check-circle"></i>
          Got it, Chef!
        </button>
      </div>
    </div>
  );
};

export default InstructionsView;