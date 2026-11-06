
import React from 'react';
import { Meal, UserProfile } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  meals: Meal[];
  profile: UserProfile | null;
  onDeleteMeal: (id: string) => void;
  onAddClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ meals, profile, onDeleteMeal, onAddClick }) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const todayMeals = meals.filter(m => m.timestamp >= today);

  const totals = todayMeals.reduce((acc, meal) => ({
    calories: acc.calories + meal.nutrition.calories,
    protein: acc.protein + meal.nutrition.protein,
    carbs: acc.carbs + meal.nutrition.carbs,
    fat: acc.fat + meal.nutrition.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const dailyGoal = profile?.dailyGoal || 2000;
  const remaining = Math.max(dailyGoal - totals.calories, 0);
  const chartData = [{ name: 'C', value: totals.calories }, { name: 'R', value: remaining }];
  const COLORS = ['#e4e4e7', '#18181b'];

  return (
    <div className="p-5 space-y-6 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Wellness</h2>
        {!profile && (
          <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-md uppercase tracking-widest animate-pulse">
            Generic Goals
          </span>
        )}
      </div>
      
      <section className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Energy Balance</h3>
          <div className="text-4xl font-black text-zinc-100 leading-none">
            {totals.calories} <span className="text-xs text-zinc-600 uppercase">kcal</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 mt-2">Daily Goal: {dailyGoal}</p>
        </div>
        <div className="w-20 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={28} outerRadius={36} paddingAngle={2} dataKey="value" stroke="none">
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 p-4 rounded-3xl text-center border border-zinc-800">
          <span className="text-[9px] font-black text-zinc-600 uppercase">Protein</span>
          <div className="text-lg font-black text-zinc-300">{Math.round(totals.protein)}g</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-3xl text-center border border-zinc-800">
          <span className="text-[9px] font-black text-zinc-600 uppercase">Carbs</span>
          <div className="text-lg font-black text-zinc-300">{Math.round(totals.carbs)}g</div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-3xl text-center border border-zinc-800">
          <span className="text-[9px] font-black text-zinc-600 uppercase">Fat</span>
          <div className="text-lg font-black text-zinc-300">{Math.round(totals.fat)}g</div>
        </div>
      </div>

      <button 
        onPointerDown={onAddClick}
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-black py-4 rounded-[1.5rem] flex items-center justify-center gap-3 cursor-pointer touch-manipulation select-none active:opacity-80 active:text-zinc-100"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <i className="fas fa-camera"></i> Log Intake
      </button>

      <div className="space-y-4 pt-4">
        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">History</h4>
        {todayMeals.length === 0 ? (
          <p className="text-center py-10 text-zinc-700 text-sm italic">No entries yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 performance-list">
            {todayMeals.map(meal => (
              <div key={meal.id} className="bg-zinc-900 p-4 rounded-[1.5rem] flex items-center gap-4 border border-zinc-800 shadow-sm relative group h-fit">
                {meal.image && <img src={meal.image} className="w-14 h-14 rounded-xl object-cover grayscale opacity-70" referrerPolicy="no-referrer" />}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-300 truncate">{meal.name}</h4>
                  <div className="text-[10px] font-black text-zinc-600 uppercase">{meal.nutrition.calories} Kcal</div>
                </div>
                <button onClick={() => onDeleteMeal(meal.id)} className="text-zinc-700 active:text-rose-900 transition-colors">
                  <i className="fas fa-trash-can text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
