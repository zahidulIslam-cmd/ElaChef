export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Meal {
  id: string;
  name: string;
  timestamp: number;
  image?: string;
  nutrition: NutritionInfo;
  ingredients: string[];
  portionSize: string;
  safetyInfo?: FoodSafetyResult;
}

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  dailyGoal: number;
}

export interface FoodSafetyResult {
  trust_score: number;
  safety_note: string;
}

export interface FoodAnalysisResult {
  foodName: string;
  confidence: number;
  estimatedNutrition: NutritionInfo;
  ingredientsFound: string[];
  suggestedPortion: string;
  safetyInfo: FoodSafetyResult;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity?: string;
}

export interface MissingIngredient {
  name: string;
  alternative?: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  prepTime: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
  bangladeshiContext: string;
  missingIngredients: MissingIngredient[];
  userRating?: 'up' | 'down' | null;
}

export interface DietMeal {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  description: string;
  nutrition: NutritionInfo;
}

export interface DietPlan {
  date: string;
  meals: DietMeal[];
  totalNutrition: NutritionInfo;
  advice: string;
}