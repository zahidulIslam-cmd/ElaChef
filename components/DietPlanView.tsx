import React, { useState, useEffect } from 'react';
import { UserProfile, GroceryItem, DietPlan } from '../types';
import { generateDailyDietPlan } from '../services/geminiService';

interface DietPlanViewProps {
  profile: UserProfile | null;
  pantry: GroceryItem[];
  onBack: () => void;
}

const DietPlanView: React.FC<DietPlanViewProps> = ({ profile, pantry, onBack }) => {
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedPlan = localStorage.getItem('notripchef_daily_diet');
    if (savedPlan) {
      const parsed = JSON.parse(savedPlan);
      // Only keep the plan if it's for today
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) {
        setDietPlan(parsed);
      }
    }
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const pantryStrings = pantry.map(i => i.quantity ? `${i.quantity} ${i.name}` : i.name);
      
      // Use a default profile if none exists
      const effectiveProfile: UserProfile = profile || {
        name: "Guest",
        age: 30,
        gender: "Other",
        weight: 70,
        height: 175,
        activityLevel: "Moderate",
        dailyGoal: 2000
      };

      const plan = await generateDailyDietPlan(effectiveProfile, pantryStrings);
      const today = new Date().toISOString().split('T')[0];
      const planWithDate = { ...plan, date: today };
      setDietPlan(planWithDate);
      localStorage.setItem('notripchef_daily_diet', JSON.stringify(planWithDate));
    } catch (err) {
      console.error(err);
      alert("Failed to generate diet plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-8 pb-32 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Diet Plan</h2>
            {!profile && (
              <span className="text-[7px] font-black bg-zinc-800 text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded uppercase tracking-widest">
                Guest Mode
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm">AI-Optimized for {profile?.name || 'you'}.</p>
        </div>
        <button 
          onPointerDown={handleGenerate}
          disabled={isLoading}
          className="text-[9px] font-black uppercase bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-full border border-zinc-700 cursor-pointer touch-manipulation select-none active:opacity-80 active:text-white transition-colors disabled:opacity-50"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          {isLoading ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-rotate mr-1"></i>}
          Refresh Plan
        </button>
      </header>

      {!dietPlan && !isLoading ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-950 rounded-[2rem] flex items-center justify-center mx-auto text-zinc-800 border border-zinc-800 shadow-inner">
            <i className="fas fa-plate-wheat text-4xl opacity-30"></i>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-zinc-200">Ready to start?</h3>
            <p className="text-xs text-zinc-500 max-w-[200px] mx-auto leading-relaxed">Let AI build a high-performance meal plan based on your current pantry and body goals.</p>
          </div>
          <button 
            onPointerDown={handleGenerate}
            className="w-full bg-zinc-100 text-zinc-950 font-black py-5 rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-3 cursor-pointer touch-manipulation select-none active:opacity-80 transition-all"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <i className="fas fa-sparkles"></i>
            Generate Daily Plan
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-6 py-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 h-32 rounded-[2rem] animate-pulse"></div>
          ))}
          <p className="text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest">Calculating Macro Distribution...</p>
        </div>
      ) : dietPlan && (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
          <section className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <i className="fas fa-bolt text-6xl"></i>
             </div>
             <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Target Summary</h4>
             <div className="flex justify-between items-end">
               <div>
                 <div className="text-3xl font-black text-zinc-100">{dietPlan.totalNutrition.calories} <span className="text-xs text-zinc-600">KCAL</span></div>
                 <p className="text-[10px] text-zinc-500 font-bold mt-1">Goal: {profile?.dailyGoal || 2000} kcal</p>
               </div>
               <div className="flex gap-4">
                 <div className="text-center">
                   <div className="text-xs font-black text-zinc-400">{Math.round(dietPlan.totalNutrition.protein)}g</div>
                   <div className="text-[8px] font-black text-zinc-700 uppercase">PRO</div>
                 </div>
                 <div className="text-center">
                   <div className="text-xs font-black text-zinc-400">{Math.round(dietPlan.totalNutrition.carbs)}g</div>
                   <div className="text-[8px] font-black text-zinc-700 uppercase">CHO</div>
                 </div>
                 <div className="text-center">
                   <div className="text-xs font-black text-zinc-400">{Math.round(dietPlan.totalNutrition.fat)}g</div>
                   <div className="text-[8px] font-black text-zinc-700 uppercase">FAT</div>
                 </div>
               </div>
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dietPlan.meals.map((meal, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 flex gap-4 transition-all active:border-zinc-700 h-fit">
                <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center flex-shrink-0 text-zinc-600 border border-zinc-800">
                  <i className={`fas ${
                    meal.type === 'Breakfast' ? 'fa-sun' : 
                    meal.type === 'Lunch' ? 'fa-cloud-sun' : 
                    meal.type === 'Dinner' ? 'fa-moon' : 'fa-cookie-bite'
                  } text-sm`}></i>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{meal.type}</span>
                    <span className="text-[10px] font-black text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">{meal.nutrition.calories} kcal</span>
                  </div>
                  <h5 className="font-black text-zinc-100 leading-tight">{meal.name}</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed italic line-clamp-2">"{meal.description}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-5">
            <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fas fa-clipboard-check text-emerald-500"></i>
              Dietary Insight
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              {dietPlan.advice}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietPlanView;