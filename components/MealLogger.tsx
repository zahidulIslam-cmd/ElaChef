
import React, { useState, useRef } from 'react';
import { analyzeMealImage } from '../services/geminiService';
import { Meal, FoodAnalysisResult } from '../types';

interface MealLoggerProps {
  onSave: (meal: Meal) => void;
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  analysis: FoodAnalysisResult | null;
  setAnalysis: (analysis: FoodAnalysisResult | null) => void;
}

const MealLogger: React.FC<MealLoggerProps> = ({ 
  onSave, 
  onCancel, 
  isLoading, 
  setIsLoading,
  capturedImage,
  setCapturedImage,
  analysis,
  setAnalysis
}) => {
  const [userContext] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        handleAnalyze(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (image: string) => {
    setIsLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeMealImage(base64Data, userContext);
      setAnalysis(result);
    } catch (error: any) {
      console.error("Meal analysis error:", error);
      const errorMessage = error?.message || "Unknown error";
      if (errorMessage.includes("API_KEY_INVALID") || !process.env.GEMINI_API_KEY) {
        alert("Analysis failed: Gemini API Key is missing or invalid. If you deployed this app manually, please set the GEMINI_API_KEY environment variable.");
      } else {
        alert(`Analysis failed: ${errorMessage}. Please check your connection and try again.`);
      }
      setCapturedImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSave = () => {
    if (analysis) {
      const newMeal: Meal = {
        id: Date.now().toString(),
        name: analysis.foodName,
        timestamp: Date.now(),
        image: capturedImage || undefined,
        nutrition: analysis.estimatedNutrition,
        ingredients: analysis.ingredientsFound,
        portionSize: analysis.suggestedPortion,
        safetyInfo: analysis.safetyInfo
      };
      onSave(newMeal);
    }
  };

  return (
    <div className="p-4 flex flex-col min-h-full">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onCancel} className="text-zinc-600 active:text-zinc-300">
          <i className="fas fa-chevron-left mr-1"></i> Back
        </button>
        <h2 className="font-bold text-xl text-zinc-100 tracking-tight">Food Vision</h2>
        <div className="w-8"></div>
      </div>

      {!capturedImage ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="w-full max-w-[280px] aspect-square bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-20 h-20 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center text-3xl border border-zinc-700">
              <i className="fas fa-camera"></i>
            </div>
            <div>
              <p className="font-bold text-zinc-300">Analyze Meal</p>
              <p className="text-xs text-zinc-600 mt-2 px-4">Identify nutrients and ingredients instantly via camera.</p>
            </div>
          </div>
          
          <div className="w-full space-y-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-zinc-100 text-zinc-950 font-bold py-4 rounded-2xl shadow-xl shadow-white/5 flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none active:opacity-80 transition-all"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <i className="fas fa-camera"></i>
              Open Lens
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative group overflow-hidden rounded-3xl shadow-lg border border-zinc-800">
            <img src={capturedImage} alt="Captured meal" className="w-full h-64 object-cover grayscale opacity-80" referrerPolicy="no-referrer" />
            {isLoading && (
              <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-zinc-100 p-6 text-center">
                <div className="w-12 h-12 border-4 border-zinc-100 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg">Analyzing...</p>
                <p className="text-sm opacity-60 mt-1 uppercase tracking-widest text-[10px]">Processing Image Data</p>
              </div>
            )}
          </div>

          {!isLoading && analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-zinc-100 leading-tight">{analysis.foodName}</h3>
                  <div className="bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-400">
                    MATCH CONFIRMED
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center shadow-sm">
                    <div className="text-[9px] text-zinc-600 uppercase font-black">Kcal</div>
                    <div className="font-bold text-zinc-100 text-lg">{analysis.estimatedNutrition.calories}</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center shadow-sm">
                    <div className="text-[9px] text-zinc-600 uppercase font-black">P</div>
                    <div className="font-bold text-zinc-400 text-lg">{Math.round(analysis.estimatedNutrition.protein)}g</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center shadow-sm">
                    <div className="text-[9px] text-zinc-600 uppercase font-black">C</div>
                    <div className="font-bold text-zinc-400 text-lg">{Math.round(analysis.estimatedNutrition.carbs)}g</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center shadow-sm">
                    <div className="text-[9px] text-zinc-600 uppercase font-black">F</div>
                    <div className="font-bold text-zinc-400 text-lg">{Math.round(analysis.estimatedNutrition.fat)}g</div>
                  </div>
                </div>
              </div>

              {/* Safety & Hygiene Card */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-zinc-100 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-shield-halved text-green-500"></i> Safety & Hygiene
                  </h4>
                  <div className={`text-lg font-black ${analysis.safetyInfo.trust_score >= 80 ? 'text-green-500' : analysis.safetyInfo.trust_score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {analysis.safetyInfo.trust_score}/100
                  </div>
                </div>
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
                  <p className="text-xs text-zinc-400 leading-relaxed italic">
                    <i className="fas fa-quote-left text-[8px] text-zinc-700 mr-2"></i>
                    {analysis.safetyInfo.safety_note}
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-1">
                <h4 className="font-black text-zinc-500 text-[10px] uppercase tracking-widest">Ingredients Detected</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.ingredientsFound.map((ing, i) => (
                    <span key={i} className="text-[11px] bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-xl font-bold border border-zinc-800">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onPointerDown={() => setCapturedImage(null)}
                  className="flex-1 bg-zinc-900 text-zinc-600 font-bold py-4 rounded-2xl border border-zinc-800 cursor-pointer touch-manipulation select-none active:opacity-80 transition-all"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  Discard
                </button>
                <button 
                  onPointerDown={handleConfirmSave}
                  className="flex-[2] bg-zinc-100 text-zinc-950 font-bold py-4 rounded-2xl shadow-xl shadow-white/5 cursor-pointer touch-manipulation select-none active:opacity-80 transition-all"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  Save to Wellness
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealLogger;
