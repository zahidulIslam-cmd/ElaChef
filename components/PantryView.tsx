import React, { useState, useRef, useCallback } from 'react';
import { GroceryItem, Recipe } from '../types';
import { analyzeGroceries, generateRecipeFromGroceries } from '../services/geminiService';
import BrandLogo from './BrandLogo';

interface PantryViewProps {
  items: GroceryItem[];
  setItems: React.Dispatch<React.SetStateAction<GroceryItem[]>>;
  savedRecipes: Recipe[];
  setSavedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  onViewCookbook: () => void;
  activeRecipe: Recipe | null;
  setActiveRecipe: (recipe: Recipe | null) => void;
}

const PantryView: React.FC<PantryViewProps> = ({ 
  items, 
  setItems, 
  savedRecipes, 
  setSavedRecipes, 
  onViewCookbook,
  activeRecipe,
  setActiveRecipe
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('veg')) return 'fa-carrot';
    if (cat.includes('fruit')) return 'fa-apple-whole';
    if (cat.includes('meat') || cat.includes('protein') || cat.includes('chicken') || cat.includes('beef')) return 'fa-drumstick-bite';
    if (cat.includes('fish') || cat.includes('seafood')) return 'fa-fish';
    if (cat.includes('grain') || cat.includes('rice') || cat.includes('wheat')) return 'fa-wheat-awn';
    if (cat.includes('spice') || cat.includes('seasoning') || cat.includes('masala')) return 'fa-pepper-hot';
    if (cat.includes('dairy') || cat.includes('milk') || cat.includes('cheese')) return 'fa-cheese';
    if (cat.includes('oil') || cat.includes('ghee')) return 'fa-bottle-droplet';
    if (cat.includes('pulse') || cat.includes('dal') || cat.includes('lentil')) return 'fa-seedling';
    return 'fa-box-archive';
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const detected = await analyzeGroceries(base64);
        setItems(prev => [...detected, ...prev]);
      } catch (err: any) {
        console.error("Pantry scan error:", err);
        const errorMessage = err?.message || "Unknown error";
        alert(`Pantry scan failed: ${errorMessage}`);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearAll = () => {
    if (items.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setItems([]);
    setShowClearConfirm(false);
  };

  const handleQuantityChange = useCallback((id: string, newQuantity: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  }, [setItems]);

  const editingItem = items.find(i => i.id === editingItemId);

  const handleGetRecipe = async (feedback?: string) => {
    if (items.length === 0) {
      alert("Scan some items in your fridge first!");
      return;
    }
    setIsGenerating(true);
    if (!feedback) setActiveRecipe(null);
    setShowFeedbackInput(false);
    try {
      const pantryStrings = items.map(i => i.quantity ? `${i.quantity} ${i.name}` : i.name);
      const result = await generateRecipeFromGroceries(pantryStrings, feedback);
      setActiveRecipe({ ...result, id: Date.now().toString() });
      if (feedback) setFeedbackText('');
    } catch (err) {
      alert("Recipe generation failed. Try adding more items.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCookbook = () => {
    if (!activeRecipe) return;
    const isAlreadySaved = savedRecipes.some(r => r.title === activeRecipe.title);
    if (!isAlreadySaved) {
      setSavedRecipes(prev => [activeRecipe, ...prev]);
      alert(`${activeRecipe.title} added to your Cookbook!`);
    } else {
      alert("This recipe is already in your cookbook!");
    }
  };

  const handleRating = (rating: 'up' | 'down') => {
    if (!activeRecipe) return;
    const newRating = activeRecipe.userRating === rating ? null : rating;
    const updatedRecipe = { ...activeRecipe, userRating: newRating };
    setActiveRecipe(updatedRecipe);
    
    if (newRating === 'down') {
      setShowFeedbackInput(true);
    } else {
      setShowFeedbackInput(false);
    }
    
    setSavedRecipes(prev => {
      const existingIndex = prev.findIndex(r => r.title === updatedRecipe.title);
      if (existingIndex > -1) {
        const newSaved = [...prev];
        newSaved[existingIndex] = updatedRecipe;
        return newSaved;
      }
      return prev;
    });
  };

  const openOrderLink = (platform: 'chaldal' | 'pathao' | 'pandamart', item: string) => {
    let url = '';
    const query = encodeURIComponent(item);
    switch (platform) {
      case 'chaldal': url = `https://chaldal.com/search/${query}`; break;
      case 'pathao': url = `https://pathao.com/food/`; break;
      case 'pandamart': url = `https://www.foodpanda.com.bd/darkstore/search?q=${query}`; break;
    }
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (!activeRecipe) return;
    const shareText = `🍳 ${activeRecipe.title}\n"${activeRecipe.description}"\n\n🛒 Ingredients:\n${activeRecipe.ingredients.map(i => `- ${i}`).join('\n')}\n\n👨‍🍳 Instructions:\n${activeRecipe.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nShared via ElaChef 🥗`.trim();
    if (navigator.share) {
      try { await navigator.share({ title: activeRecipe.title, text: shareText }); } catch (err) { }
    } else {
      try { await navigator.clipboard.writeText(shareText); alert('Recipe copied to clipboard!'); } catch (err) { alert('Could not copy recipe.'); }
    }
  };

  return (
    <>
      <div className="p-5 space-y-8 animate-in fade-in duration-500 pb-20">
        <section className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Your Kitchen</h2>
            <p className="text-zinc-600 text-sm">Master your inventory.</p>
          </div>
          <button 
            onClick={onViewCookbook}
            className="text-[10px] font-black uppercase text-zinc-500 border border-zinc-800 px-4 py-2 rounded-full active:bg-zinc-900 transition-all active:scale-98 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            My Cookbook
          </button>
        </section>

        <div className="bg-zinc-900 rounded-[2.5rem] p-7 border border-zinc-800 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-zinc-600 uppercase tracking-widest text-[9px]">Stockpiled Ingredients</h3>
              {items.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-[8px] font-black text-rose-500/60 active:text-rose-500 uppercase tracking-widest border border-rose-500/20 px-2 py-1 rounded-md transition-all active:scale-98 touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                  >
                  Clear All
                </button>
              )}
            </div>
            <span className="bg-zinc-800 text-zinc-400 text-[9px] font-black px-3 py-1.5 rounded-full border border-zinc-700 tracking-widest">{items.length} TOTAL</span>
          </div>

          <div className="flex flex-col gap-3 min-h-[120px]">
            {items.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-12 text-zinc-700 text-center">
                <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800/50">
                  <BrandLogo size="md" className="opacity-10 text-white" />
                </div>
                <p className="text-sm font-bold text-zinc-400">Inventory is empty</p>
                <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-1">Add items to unlock recipes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar performance-list">
                {items.map(item => (
                  <div key={item.id} className="bg-zinc-950 border border-zinc-800 px-4 py-4 rounded-2xl shadow-sm flex items-center justify-between group active:border-zinc-700 transition-colors h-fit">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-zinc-900 w-9 h-9 rounded-xl flex items-center justify-center text-zinc-500 flex-shrink-0 border border-zinc-800">
                        <i className={`fas ${getCategoryIcon(item.category)} text-sm text-zinc-300`}></i>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-zinc-300 truncate">{item.name}</span>
                        <span className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">{item.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => setEditingItemId(item.id)}
                        className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold px-2 py-2 rounded-xl w-16 text-zinc-400 text-center cursor-pointer active:border-zinc-600 transition-all truncate"
                      >
                        {item.quantity || 'Amt'}
                      </div>
                      <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="w-8 h-8 flex items-center justify-center text-zinc-800 active:text-rose-900 transition-colors">
                        <i className="fas fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="mt-8 w-full bg-zinc-100 text-zinc-950 py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 cursor-pointer touch-manipulation select-none active:opacity-80 shadow-2xl shadow-white/5"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <i className={`fas ${isScanning ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
            {isScanning ? 'Syncing Pantry...' : 'Add Ingredients'}
          </button>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleScan} accept="image/*" />
        </div>

        <button 
          onPointerDown={() => handleGetRecipe()}
          disabled={isGenerating || items.length === 0}
          className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 font-black py-6 rounded-[2rem] shadow-xl flex items-center justify-center gap-4 cursor-pointer touch-manipulation select-none active:opacity-80 disabled:opacity-20 group"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          {isGenerating ? (
            <><i className="fas fa-sparkles fa-spin text-zinc-500"></i> Thinking...</>
          ) : (
            <>
              <i className="fas fa-utensils text-green-500 group-active:scale-110 transition-transform"></i> 
              Generate Zero-Trip Recipe
            </>
          )}
        </button>

        {activeRecipe && (
          <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl p-7 space-y-6 animate-in slide-in-from-bottom-10 duration-700">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${activeRecipe.missingIngredients.length === 0 ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-amber-950/30 text-amber-400 border-amber-900/50'}`}>
                    {activeRecipe.missingIngredients.length === 0 ? 'READY TO COOK' : 'SUBSTITUTES NEEDED'}
                  </span>
                  <span className="text-zinc-600 font-black text-[10px] uppercase">{activeRecipe.prepTime}</span>
                </div>
                <h3 className="text-2xl font-black text-zinc-100 leading-tight tracking-tight">{activeRecipe.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="bg-zinc-800 text-zinc-500 w-10 h-10 rounded-full flex items-center justify-center border border-zinc-700 active:text-zinc-100 transition-all"><i className="fas fa-share-nodes text-sm"></i></button>
                <button onClick={() => setActiveRecipe(null)} className="bg-zinc-800 text-zinc-500 w-10 h-10 rounded-full flex items-center justify-center border border-zinc-700 active:text-rose-500 transition-all"><i className="fas fa-times"></i></button>
              </div>
            </div>

            <p className="text-zinc-500 text-sm italic leading-relaxed border-l-2 border-zinc-800 pl-4">"{activeRecipe.description}"</p>

              <button 
                onClick={handleSaveToCookbook}
                className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  savedRecipes.some(r => r.title === activeRecipe.title) 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700 active:bg-zinc-700'
                }`}
              >
              <i className={`fas ${savedRecipes.some(r => r.title === activeRecipe.title) ? 'fa-check-double' : 'fa-bookmark'}`}></i>
              {savedRecipes.some(r => r.title === activeRecipe.title) ? 'Added to Cookbook' : 'Save to Cookbook'}
            </button>

            {activeRecipe.missingIngredients.length > 0 && (
              <div className="bg-amber-950/10 rounded-[2rem] p-6 border border-amber-900/20 space-y-4">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-sparkles"></i> AI Substitute Assistant
                </h4>
                <div className="flex flex-col gap-3">
                  {activeRecipe.missingIngredients.map((missing, i) => (
                    <div key={i} className="bg-zinc-950 p-4 rounded-2xl border border-amber-900/10 shadow-sm space-y-2">
                      <div className="text-xs font-black text-zinc-100 uppercase">{missing.name}</div>
                      {missing.alternative && (
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          <span className="text-amber-600 font-bold uppercase text-[9px]">Swap for:</span> {missing.alternative}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button onClick={() => openOrderLink('chaldal', missing.name)} className="text-[9px] font-black bg-[#ffeb3b] text-slate-900 px-3 py-1.5 rounded-lg border border-yellow-400 uppercase">Chaldal</button>
                        <button onClick={() => openOrderLink('pandamart', missing.name)} className="text-[9px] font-black bg-[#D70F64] text-white px-3 py-1.5 rounded-lg uppercase">PandaMart</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="font-black text-zinc-100 text-[10px] uppercase tracking-[0.2em] border-b border-zinc-800 pb-3">Cooking Instructions</h4>
              <div className="space-y-6">
                {activeRecipe.instructions.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="bg-zinc-100 text-zinc-950 w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 shadow-lg shadow-white/5">{i+1}</div>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {activeRecipe.bangladeshiContext && (
              <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800">
                 <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Regional Context</span>
                 <p className="text-[11px] text-zinc-500 italic leading-snug">{activeRecipe.bangladeshiContext}</p>
              </div>
            )}

            <div className="pt-6 border-t border-zinc-800 flex flex-col items-center gap-5">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">How was this recipe?</p>
              <div className="flex gap-6">
                <button 
                  onClick={() => handleRating('up')} 
                  className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${activeRecipe.userRating === 'up' ? 'bg-zinc-100 text-zinc-950 shadow-2xl scale-110' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}
                >
                  <i className="fas fa-thumbs-up text-xl"></i>
                </button>
                <button 
                  onClick={() => handleRating('down')} 
                  className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${activeRecipe.userRating === 'down' ? 'bg-rose-950 text-rose-500 border border-rose-900 shadow-2xl scale-110' : 'bg-zinc-900 text-zinc-600 border border-zinc-800'}`}
                >
                  <i className="fas fa-thumbs-down text-xl"></i>
                </button>
              </div>

              {showFeedbackInput && (
                <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell Chef Gemini what to change... (e.g., I don't like mustard oil, or make it spicier)"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs text-zinc-300 placeholder:text-zinc-800 focus:ring-1 focus:ring-zinc-600 outline-none min-h-[100px] resize-none"
                  />
                  <button 
                    onClick={() => handleGetRecipe(feedbackText)}
                    disabled={isGenerating || !feedbackText.trim()}
                    className="w-full bg-zinc-100 text-zinc-950 font-black py-5 rounded-[1.5rem] text-[10px] uppercase tracking-widest active:bg-white disabled:opacity-20 transition-all flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-rotate"></i>
                    Regenerate with Feedback
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quantity Editor Pop-up - Moved outside animated container */}
      {editingItemId && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-black text-zinc-100">{editingItem.name}</h4>
                <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Update Quantity</p>
              </div>
              <button 
                onClick={() => setEditingItemId(null)}
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 active:text-zinc-100 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <input 
              autoFocus
              type="text"
              value={editingItem.quantity || ''}
              onChange={(e) => handleQuantityChange(editingItem.id, e.target.value)}
              placeholder="e.g., 500g, 2 large, half full"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-zinc-100 font-bold placeholder:text-zinc-800 focus:ring-1 focus:ring-zinc-600 outline-none mb-8"
              onKeyDown={(e) => e.key === 'Enter' && setEditingItemId(null)}
            />

            <button 
              onClick={() => setEditingItemId(null)}
              className="w-full bg-zinc-100 text-zinc-950 font-black py-5 rounded-2xl text-sm active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal - Moved outside animated container */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900 w-full max-w-xs rounded-[2rem] border border-zinc-800 p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 border border-rose-500/20">
              <i className="fas fa-trash-can"></i>
            </div>
            <h4 className="text-lg font-black text-zinc-100 mb-2">Clear all listed ingredients?</h4>
            <p className="text-xs text-zinc-500 mb-8">This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-zinc-800 text-zinc-400 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest active:bg-zinc-700 transition-all"
              >
                No
              </button>
              <button 
                onClick={confirmClear}
                className="flex-1 bg-rose-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest active:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PantryView;