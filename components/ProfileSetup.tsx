import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileSetupProps {
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserProfile>(profile || {
    name: '',
    weight: 70,
    height: 170,
    age: 25,
    gender: 'male',
    activityLevel: 'moderate',
    dailyGoal: 2000
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'gender' || name === 'activityLevel' || name === 'name' ? value : Number(value)
    }));
  };

  const calculateSuggestedCalories = () => {
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5;
    } else {
      bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age - 161;
    }
    const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = bmr * multipliers[formData.activityLevel];
    setFormData(prev => ({ ...prev, dailyGoal: Math.round(tdee) }));
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      <div>
        <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Profile</h2>
        <p className="text-zinc-500 text-sm">Your physical data and wellness goals.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1 tracking-widest">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange}
              placeholder="E.g. Chef Salman"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-zinc-500 focus:outline-none font-semibold text-zinc-100 placeholder-zinc-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1 tracking-widest">Age</label>
              <input 
                type="number" 
                name="age" 
                value={formData.age} 
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1 tracking-widest">Gender</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 font-semibold appearance-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase mb-4 ml-1 tracking-widest">Body Stats</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-2 ml-1">Weight (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-100" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-2 ml-1">Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-zinc-100" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase mb-2 ml-1 tracking-widest">Activity Level</label>
              <select 
                name="activityLevel" 
                value={formData.activityLevel} 
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 font-semibold appearance-none"
              >
                <option value="sedentary">Sedentary (Office job)</option>
                <option value="light">Lightly Active</option>
                <option value="moderate">Moderately Active</option>
                <option value="active">Very Active</option>
              </select>
            </div>

            <div className="flex justify-between items-center mb-2 px-1 mt-6">
              <label className="block text-[10px] font-black text-zinc-500 uppercase">Daily Calorie Target</label>
              <button onClick={calculateSuggestedCalories} className="text-zinc-400 text-[10px] font-black uppercase tracking-wider active:text-zinc-100 flex items-center gap-1.5 touch-manipulation" style={{ touchAction: 'manipulation' }}>
                <i className="fas fa-wand-sparkles text-[9px]"></i>
                Auto-Tune
              </button>
            </div>
            <input 
              type="number" 
              name="dailyGoal" 
              value={formData.dailyGoal} 
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-5 text-zinc-100 font-black text-3xl shadow-inner"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          {onCancel && (
            <button onClick={onCancel} className="flex-1 bg-zinc-900 text-zinc-600 font-bold py-4 rounded-2xl border border-zinc-800 active:scale-98 transition-transform touch-manipulation" style={{ touchAction: 'manipulation' }}>Cancel</button>
          )}
          <button 
            onClick={() => onSave(formData)}
            className="flex-[2] bg-zinc-100 text-zinc-950 font-bold py-4 rounded-2xl shadow-xl shadow-white/5 active:scale-98 transition-all touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;