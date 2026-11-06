import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';

interface CookbookViewProps {
  recipes: Recipe[];
  setSavedRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  onBack: () => void;
  viewTitle?: string;
  emptyMessage?: string;
  sharedRecipe?: Recipe | null;
  onClearShared?: () => void;
}

const CookbookView: React.FC<CookbookViewProps> = ({ 
  recipes, 
  setSavedRecipes, 
  onBack, 
  viewTitle = "Cookbook",
  emptyMessage = "Your cookbook is empty. Generate a recipe in the kitchen and save it to see it here.",
  sharedRecipe,
  onClearShared
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (sharedRecipe) {
      setSelectedRecipe(sharedRecipe);
    }
  }, [sharedRecipe]);

  const handleDelete = (id: string | undefined) => {
    if (!id) return;
    if (confirm("Remove this recipe from your collection?")) {
      setSavedRecipes(prev => prev.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    }
  };

  const handleShare = async (recipe: Recipe) => {
    // Generate a deep link by encoding the recipe data
    const recipeData = btoa(JSON.stringify(recipe));
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${recipeData}`;
    
    const shareText = `🍳 ${recipe.title}\n"${recipe.description}"\n\nTry this recipe on ElaChef: ${shareUrl}`.trim();

    if (navigator.share) {
      try { 
        await navigator.share({ 
          title: `ElaChef: ${recipe.title}`, 
          text: shareText,
          url: shareUrl
        }); 
      } catch (err) { }
    } else {
      try { 
        await navigator.clipboard.writeText(shareUrl); 
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) { 
        alert('Could not copy link.'); 
      }
    }
  };

  const handleSaveShared = () => {
    if (selectedRecipe) {
      setSavedRecipes(prev => {
        if (prev.some(r => r.title === selectedRecipe.title)) return prev;
        return [selectedRecipe, ...prev];
      });
      alert("Recipe saved to your cookbook!");
    }
  };

  return (
    <>
      <div className="p-5 space-y-8 animate-in fade-in duration-500 pb-20 relative">
        <header className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-600 active:text-zinc-300 touch-manipulation" style={{ touchAction: 'manipulation' }}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <div>
            <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">{viewTitle}</h2>
            <p className="text-zinc-500 text-sm">Your private collection of verified tastes.</p>
          </div>
        </header>

        {recipes.length === 0 && !sharedRecipe ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-800 border border-zinc-800">
              <i className={`fas ${viewTitle.toLowerCase().includes('like') ? 'fa-heart' : 'fa-book-open'} text-3xl opacity-20`}></i>
            </div>
            <div>
              <p className="text-zinc-400 font-bold">Collection is empty</p>
              <p className="text-xs text-zinc-600 max-w-[200px] mt-1">{emptyMessage}</p>
            </div>
          <button 
            onPointerDown={onBack}
            className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-950 px-6 py-3 rounded-full shadow-lg cursor-pointer touch-manipulation select-none active:opacity-80 transition-all"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            Back to Kitchen
          </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map(recipe => (
                <div 
                  key={recipe.id} 
                  className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-5 shadow-sm active:border-zinc-700 transition-all group h-fit"
                >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">{recipe.prepTime}</span>
                      {recipe.userRating === 'up' && <i className="fas fa-heart text-rose-500 text-[10px]"></i>}
                    </div>
                    <h3 className="text-xl font-black text-zinc-100 leading-tight active:text-white">{recipe.title}</h3>
                  </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleShare(recipe)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 active:text-green-500 active:bg-zinc-800 touch-manipulation" style={{ touchAction: 'manipulation' }} title="Get Share Link"><i className="fas fa-link text-xs"></i></button>
                      <button onClick={() => handleDelete(recipe.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 active:text-rose-500 active:bg-zinc-800 touch-manipulation" style={{ touchAction: 'manipulation' }}><i className="fas fa-trash-can text-xs"></i></button>
                    </div>
                </div>
                
                <p className="text-zinc-500 text-xs line-clamp-2 italic mb-4">"{recipe.description}"</p>
                
                <button 
                  onPointerDown={() => setSelectedRecipe(recipe)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-400 font-black text-[10px] uppercase py-3 rounded-xl cursor-pointer touch-manipulation select-none active:opacity-80 active:text-zinc-100 transition-colors"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  View Full Recipe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Recipe Modal - Moved outside animated container */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 overflow-y-auto p-5 animate-in slide-in-from-bottom-20 duration-500 custom-scrollbar">
          <div className="max-w-md md:max-w-2xl lg:max-w-3xl mx-auto space-y-6 pb-20">
            <header className="flex justify-between items-start">
              <button onClick={() => { setSelectedRecipe(null); if(onClearShared) onClearShared(); }} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400"><i className="fas fa-times"></i></button>
              <div className="flex gap-2">
                <button onClick={() => handleShare(selectedRecipe)} className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400"><i className="fas fa-link"></i></button>
              </div>
            </header>

            <div className="space-y-4">
              {sharedRecipe && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-green-500 uppercase">Received Shared Recipe</p>
                  <button onClick={handleSaveShared} className="bg-green-500 text-black text-[9px] font-black px-3 py-1.5 rounded-lg uppercase">Save to My Library</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="bg-emerald-950/30 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-900/50">{selectedRecipe.prepTime}</span>
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{selectedRecipe.servings} Servings</span>
              </div>
              <h2 className="text-4xl font-black text-zinc-100 leading-none">{selectedRecipe.title}</h2>
              <p className="text-zinc-500 italic">"{selectedRecipe.description}"</p>
            </div>

            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-[2.5rem] border border-zinc-900">
              <h4 className="text-xs font-black text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">Ingredients</h4>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-zinc-100 uppercase tracking-widest border-b border-zinc-800 pb-2">Instructions</h4>
              <div className="space-y-6">
                {selectedRecipe.instructions.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="bg-green-500 text-black w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10">
              <button 
                onClick={() => { setSelectedRecipe(null); if(onClearShared) onClearShared(); }}
                className="w-full bg-zinc-100 text-zinc-950 font-black py-5 rounded-[2rem] shadow-xl"
              >
                Close Recipe
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-black px-6 py-3 rounded-full font-black text-[10px] uppercase shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-5">
          Link Copied to Clipboard!
        </div>
      )}
    </>
  );
};

export default CookbookView;