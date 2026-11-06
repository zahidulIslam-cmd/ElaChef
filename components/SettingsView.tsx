import React, { useState, useEffect } from 'react';
import BrandLogo from './BrandLogo';

interface SettingsViewProps {
  onViewInstructions: () => void;
  onInstall?: () => void;
  tagline: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onViewInstructions, onInstall, tagline }) => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
  }, []);

  const [apiStatus, setApiStatus] = useState<"checking" | "found" | "missing">("checking");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keySource, setKeySource] = useState<string>("");
  const [maskedKey, setMaskedKey] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>(localStorage.getItem("GEMINI_API_KEY_OVERRIDE") || "");

  const checkApi = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      
      if (data.GEMINI_API_KEY && data.GEMINI_API_KEY.length > 10) {
        setApiStatus("found");
      } else {
        setApiStatus("missing");
      }
    } catch (e) {
      setApiStatus("missing");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  const [testResult, setTestResult] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult("");
    try {
      const response = await fetch("/api/config?t=" + Date.now());
      const data = await response.json();
      
      const localKey = localStorage.getItem("GEMINI_API_KEY_OVERRIDE");
      const key = (!localKey || localKey.length < 10) ? data.GEMINI_API_KEY : localKey;
      
      if (!key || key.length < 10) {
        let debugInfo = "";
        if (data.debug) {
          debugInfo = `\n\nDebug Info:\n- Keys found: ${data.debug.keysFound?.join(", ") || "None"}\n- GEMINI_API_KEY present: ${data.debug.geminiKeyPresent}`;
        }
        throw new Error(`No API key detected. Please check your Cloud Run environment variables or use the Manual Override below.${debugInfo}`);
      }
      
      // Direct fetch to bypass SDK complexity and see raw error
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key.trim()}`;
      const rawResponse = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
      });
      
      const rawData = await rawResponse.json();
      
      if (!rawResponse.ok) {
        // Extract the most useful error message
        const errorMsg = rawData.error?.message || JSON.stringify(rawData);
        throw new Error(`Google API Error (${rawResponse.status}): ${errorMsg}`);
      }
      
      setTestResult(`Success! API responded: "${rawData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK'}"`);
    } catch (err: any) {
      console.error("Test connection failed:", err);
      setTestResult(`Error: ${err.message || "Unknown error"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveManualKey = () => {
    if (manualKey.trim()) {
      localStorage.setItem("GEMINI_API_KEY_OVERRIDE", manualKey.trim());
      alert("Key saved to browser memory! Refreshing status...");
      checkApi();
    } else {
      localStorage.removeItem("GEMINI_API_KEY_OVERRIDE");
      alert("Manual override cleared.");
      checkApi();
    }
  };
  const handleShareApp = async () => {
    const shareData = {
      title: 'ElaChef',
      text: `${tagline}! Check out ElaChef. 🥗🍳`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.debug('Native share cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('App link copied to clipboard! Send it to your friends.');
      } catch (err) {
        alert('Could not copy link to clipboard.');
      }
    }
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div>
        <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Settings</h2>
        <p className="text-zinc-500 text-sm">Application preferences and tools.</p>
      </div>

      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">System Status</h4>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
            apiStatus === 'found' ? 'bg-emerald-500/10 text-emerald-500' : 
            apiStatus === 'missing' ? 'bg-rose-500/10 text-rose-500' : 
            'bg-zinc-800 text-zinc-400 animate-pulse'
          }`}>
            <i className={`fas ${
              apiStatus === 'found' ? 'fa-check-circle' : 
              apiStatus === 'missing' ? 'fa-exclamation-triangle' : 
              'fa-sync-alt'
            } text-lg`}></i>
          </div>
          <div className="text-left flex-1">
            <h4 className="font-black text-base leading-tight">
              {apiStatus === 'found' ? 'System Online' : apiStatus === 'missing' ? 'System Offline' : 'Checking System...'}
            </h4>
            <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">
              {apiStatus === 'found' ? 'AI Engine Connected' : 'Connection Error'}
            </p>
          </div>
          <button 
            onClick={checkApi}
            disabled={isRefreshing}
            className={`w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 active:text-zinc-100 transition-all active:scale-90 touch-manipulation ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ touchAction: 'manipulation' }}
          >
            <i className="fas fa-sync-alt text-xs"></i>
          </button>
        </div>

        {apiStatus === 'missing' && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 mt-3">
            <p className="text-[10px] text-rose-400 font-medium leading-relaxed">
              The AI engine is currently unavailable. Please try again later or contact support.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Support & Community</h4>
        <div className="grid gap-3">
          <button 
            onClick={onViewInstructions}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 transition-all active:border-zinc-700 group active:scale-98 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="bg-zinc-800 w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-100 active:bg-zinc-700 transition-colors shadow-lg">
              <i className="fas fa-book-open text-lg"></i>
            </div>
            <div className="text-left">
              <h4 className="font-black text-base leading-tight">User Guide</h4>
              <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">Learn how to master your pantry</p>
            </div>
            <i className="fas fa-chevron-right ml-auto text-zinc-600"></i>
          </button>

          <button 
            onClick={handleShareApp}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4 transition-all active:border-zinc-700 group active:scale-98 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="bg-zinc-800 w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-100 active:bg-zinc-700 transition-colors shadow-lg">
              <i className="fas fa-paper-plane text-lg"></i>
            </div>
            <div className="text-left">
              <h4 className="font-black text-base leading-tight">Invite Friends</h4>
              <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">Share the ElaChef link</p>
            </div>
            <i className="fas fa-chevron-right ml-auto text-zinc-600"></i>
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Mobile Experience</h4>
        
        <div className="grid gap-3">
          {onInstall ? (
            <button 
              onClick={onInstall}
              className="bg-zinc-100 rounded-2xl p-5 text-zinc-950 shadow-xl shadow-white/5 flex items-center gap-4 transition-transform active:scale-98 group border-2 border-zinc-100 active:bg-zinc-200 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="bg-zinc-950 w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-100 active:bg-zinc-800 transition-colors shadow-lg">
                <i className="fas fa-download text-lg"></i>
              </div>
              <div className="text-left">
                <h4 className="font-black text-base leading-tight">Install ElaChef</h4>
                <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-0.5">Download direct to home screen</p>
              </div>
              <i className="fas fa-chevron-right ml-auto text-zinc-400"></i>
            </button>
          ) : isIOS ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400">
                  <i className="fas fa-mobile-screen"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-100">iOS Installation</h4>
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Add to Home Screen</p>
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                Tap the <i className="fas fa-share-square text-zinc-100 mx-1"></i> Share button in your Safari browser and select <span className="text-zinc-100 font-bold italic">"Add to Home Screen"</span> to download the app.
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
              <p className="text-xs text-zinc-500 font-medium">App is already installed or your browser handles installation via its menu.</p>
            </div>
          )}
        </div>
      </section>
      
      <div className="pt-10 border-t border-zinc-900 flex flex-col items-center gap-4">
        <BrandLogo size="md" className="text-zinc-800 opacity-50" />
        <div className="text-center">
          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">ElaChef v2.0.0</p>
          <p className="text-[8px] font-medium text-zinc-800 uppercase tracking-widest mt-1">{tagline}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;