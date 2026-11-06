import React, { useState, useEffect, useMemo, Suspense, lazy, Component } from 'react';
import { Meal, UserProfile, GroceryItem, Recipe, FoodAnalysisResult } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import PantryView from './components/PantryView';
import Dashboard from './components/Dashboard';

// Lazy load remaining views to keep initial bundle manageable
const MealLogger = lazy(() => import('./components/MealLogger'));
const ProfileSetup = lazy(() => import('./components/ProfileSetup'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const CookbookView = lazy(() => import('./components/CookbookView'));
const DietPlanView = lazy(() => import('./components/DietPlanView'));
const InstructionsView = lazy(() => import('./components/InstructionsView'));

const LoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in duration-700">
    <div className="relative">
      <div className="w-16 h-16 rounded-3xl border-2 border-green-500/10 border-t-green-500 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <i className="fas fa-utensils text-green-500/40 text-xs"></i>
      </div>
    </div>
    <div className="text-center space-y-1">
      <p className="text-zinc-100 text-sm font-black uppercase tracking-[0.2em]">ElaChef</p>
      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Preparing your kitchen...</p>
    </div>
  </div>
);

const TAGLINES = [
  "Cook Smarter, Not Harder",
  "From Pantry to Plate, Instantly",
  "Delicious Made Easy",
  "Smart Cooking, Instant Meals",
  "Turn Ingredients into Magic"
];

// Error Boundary to prevent total blank screens
class ErrorBoundary extends Component<any, any> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center text-3xl border border-rose-500/20">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-100">Something went wrong</h2>
            <p className="text-zinc-500 text-sm">The kitchen encountered an unexpected error.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-zinc-100 text-zinc-950 font-black px-8 py-4 rounded-2xl shadow-xl uppercase text-xs tracking-widest active:scale-95 transition-all"
          >
            Reload App
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'logger' | 'pantry' | 'profile' | 'cookbook' | 'dietPlan' | 'instructions' | 'settings'>('pantry');
  
  // Initialize state from localStorage immediately to avoid "empty -> load" flicker
  const [meals, setMeals] = useState<Meal[]>(() => {
    try {
      const saved = localStorage.getItem('notripchef_meals');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [pantry, setPantry] = useState<GroceryItem[]>(() => {
    try {
      const saved = localStorage.getItem('notripchef_pantry');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem('notripchef_saved_recipes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('notripchef_profile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [sharedRecipe, setSharedRecipe] = useState<Recipe | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(null);

  // Pick a random tagline for this session
  const sessionTagline = useMemo(() => {
    return TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  }, []);

  useEffect(() => {
    console.log("App initialized with view:", view);
    
    // Handle Deep Linking (Shareable URLs)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('share');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        setSharedRecipe(decoded);
        setView('cookbook');
        // Clear URL without refreshing to keep it clean
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to decode shared recipe", e);
      }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('notripchef_meals', JSON.stringify(meals));
    localStorage.setItem('notripchef_pantry', JSON.stringify(pantry));
    localStorage.setItem('notripchef_saved_recipes', JSON.stringify(savedRecipes));
    localStorage.setItem('notripchef_profile', JSON.stringify(profile));
  }, [meals, pantry, profile, savedRecipes]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const handleAddMeal = (meal: Meal) => {
    setMeals(prev => [meal, ...prev]);
    setView('dashboard');
  };

  return (
    <ErrorBoundary>
      <div 
        className="h-screen h-[100dvh] flex flex-col w-full md:max-w-2xl lg:max-w-3xl mx-auto bg-zinc-950 shadow-2xl relative overflow-hidden text-zinc-100 md:border-x border-zinc-900"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)'
        }}
      >
        <Header setView={setView as any} currentView={view} tagline={sessionTagline} />
        
        <main 
          className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10rem)' }}
        >
          <Suspense fallback={<LoadingFallback />}>
            {view === 'pantry' && (
              <PantryView 
                items={pantry} 
                setItems={setPantry}
                savedRecipes={savedRecipes}
                setSavedRecipes={setSavedRecipes}
                onViewCookbook={() => setView('cookbook')}
                activeRecipe={activeRecipe}
                setActiveRecipe={setActiveRecipe}
              />
            )}

            {view === 'cookbook' && (
              <CookbookView 
                recipes={savedRecipes}
                setSavedRecipes={setSavedRecipes}
                onBack={() => setView('pantry')}
                viewTitle="Cookbook"
                sharedRecipe={sharedRecipe}
                onClearShared={() => setSharedRecipe(null)}
                emptyMessage="Your cookbook is empty. Generate a recipe in the kitchen and save it to see it here."
              />
            )}

            {view === 'dietPlan' && (
              <DietPlanView 
                profile={profile}
                pantry={pantry}
                onBack={() => setView('profile')}
              />
            )}

            {view === 'dashboard' && (
              <Dashboard 
                meals={meals} 
                profile={profile} 
                onDeleteMeal={(id) => setMeals(m => m.filter(x => x.id !== id))}
                onAddClick={() => setView('logger')}
              />
            )}
            
            {view === 'logger' && (
              <MealLogger 
                onSave={handleAddMeal} 
                onCancel={() => setView('dashboard')}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                capturedImage={capturedImage}
                setCapturedImage={setCapturedImage}
                analysis={analysis}
                setAnalysis={setAnalysis}
              />
            )}
            
            {view === 'profile' && (
              <ProfileSetup 
                profile={profile} 
                onSave={(p) => { setProfile(p); setView('pantry'); }} 
                onCancel={() => setView('pantry')}
              />
            )}

            {view === 'settings' && (
              <SettingsView 
                onViewInstructions={() => setView('instructions')}
                onInstall={deferredPrompt ? handleInstall : undefined}
                tagline={sessionTagline}
              />
            )}

            {view === 'instructions' && (
              <InstructionsView onBack={() => setView('settings')} />
            )}
          </Suspense>
        </main>

        <Footer setView={setView as any} currentView={view} />
      </div>
    </ErrorBoundary>
  );
};

export default App;