
import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysisResult, GroceryItem, Recipe, UserProfile, DietPlan } from "../types";

// Runtime key storage
let runtimeApiKey: string | null = null;

const getApiKey = async () => {
  const isPlaceholder = (k?: string) => !k || k.includes("TODO") || k.includes("YOUR_API_KEY") || k.length < 10;

  // 1. Try to get it from the server (Full-Stack runtime)
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      if (!isPlaceholder(config.GEMINI_API_KEY)) {
        runtimeApiKey = config.GEMINI_API_KEY.trim();
        return runtimeApiKey;
      }
    }
  } catch (e) {
    console.warn("Could not fetch config from server, falling back to build-time env.");
  }

  // 2. Fallback to build-time environment variables
  const buildTimeKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!isPlaceholder(buildTimeKey)) {
    runtimeApiKey = buildTimeKey!.trim();
    return runtimeApiKey;
  }

  return "";
};

// We initialize the AI instance lazily to ensure we have the key
let aiInstance: GoogleGenAI | null = null;

const getAI = async () => {
  const key = await getApiKey();
  if (!aiInstance || (key && runtimeApiKey !== key)) {
    aiInstance = new GoogleGenAI({ apiKey: key || "" });
  }
  return aiInstance;
};

const verifyApiKey = async () => {
  const key = await getApiKey();
  if (!key) {
    throw new Error("AI engine connection error. Please try again later.");
  }
};

export const analyzeMealImage = async (base64Image: string, userContext?: string): Promise<FoodAnalysisResult> => {
  await verifyApiKey();
  const ai = await getAI();
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a professional Nutritionist with global expertise.
    Analyze the meal image and provide nutritional info. Expert in Global and Bangladeshi cuisines.
    Provide the response in structured JSON.
  `;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: `Analyze this meal. ${userContext || ""}` }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          estimatedNutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            },
            required: ["calories", "protein", "carbs", "fat"]
          },
          ingredientsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedPortion: { type: Type.STRING },
          safetyInfo: {
            type: Type.OBJECT,
            properties: {
              trust_score: { type: Type.NUMBER, description: "Safety and hygiene score from 0 to 100" },
              safety_note: { type: Type.STRING, description: "Reasoning behind the safety and hygiene score" }
            },
            required: ["trust_score", "safety_note"]
          }
        },
        required: ["foodName", "estimatedNutrition", "ingredientsFound", "suggestedPortion", "safetyInfo"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeGroceries = async (base64Image: string): Promise<GroceryItem[]> => {
  await verifyApiKey();
  const ai = await getAI();
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    Identify all raw grocery items and their approximate quantities from the image. 
    Recognize items from global and local markets, especially Bangladeshi staples like different types of rice, lentils (dal), and regional vegetables.
    For each item, estimate a quantity (e.g., '500g', '2 large', 'half full', 'small bunch').
  `;
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: "List items found and their quantities." }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            quantity: { type: Type.STRING, description: "Approximate amount seen in image" }
          },
          required: ["name", "category", "quantity"]
        }
      }
    }
  });
  const results = JSON.parse(response.text || "[]");
  return results.map((item: any) => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
};

export const generateRecipeFromGroceries = async (pantryItems: string[], feedback?: string): Promise<Recipe> => {
  await verifyApiKey();
  const ai = await getAI();
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are a Master Chef expert in Halal-friendly Global and Bangladeshi cuisine for the ElaChef application. 
    Your goal is to create a "Zero-Trip" recipe using ONLY the user's current pantry items.
    
    The user has provided items with quantities. Use this to ensure the recipe is feasible for the amount they have.
    
    ${feedback ? `CRITICAL USER FEEDBACK ON PREVIOUS ATTEMPT: "${feedback}". Adjust your logic to fix this.` : ''}

    Hyper-Detailed Instruction Guidelines (Beginner Friendly):
    1. BREAK DOWN STEPS: Split complex actions into smaller, atomic sub-steps. No step should contain more than two related actions.
    2. TEMPERATURE & HEAT: Always specify the heat level (e.g., "Low heat", "Medium heat", "High heat").
    3. PRECISE TIMING: Use specific time ranges (e.g., "3-5 minutes", "exactly 12 minutes") rather than vague terms like "cook until done".
    4. SENSORY INDICATORS: Tell the user what to look, smell, or feel for (e.g., "until the onions turn translucent and slightly golden", "until the raw smell of ginger-garlic paste disappears", "until the oil starts to separate from the masala", "until the dal is soft enough to mash with a spoon").
    5. TECH-EXPLAIN: For Bangladeshi techniques, explain clearly for a novice:
       - "Bhuna": explain it as sautéing spices with meat/veg over medium heat until the moisture evaporates and oil surfaces.
       - "Tarka/Baghaar": explain it as tempering whole spices in hot oil or ghee in a separate small pan to pour over the finished dish.
    6. PREP FIRST: Always start with a specific prep step for washing, soaking, and cutting to help a beginner organize their workspace.

    Substitution Intelligence:
    - If a core ingredient is missing, provide a diverse, descriptive alternative.
    - Match flavor profiles for spices (e.g., if Garam Masala is missing, suggest a blend of Cinnamon, Cardamom, and Cloves).
    - Suggest local alternatives (e.g., if Ghee is missing, explain using Mustard Oil for a pungent kick or Butter for richness).

    Local Relevance:
    - Heavily prioritize Bangladeshi staples (Rice, Dal, Bhorta styles) and cooking techniques.
    
    Output must be JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `The user has: ${pantryItems.join(", ")}. Suggest the best recipe based on these specific amounts.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          servings: { type: Type.NUMBER },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          bangladeshiContext: { type: Type.STRING },
          missingIngredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                alternative: { type: Type.STRING, description: "A contextually relevant, descriptive substitution." }
              },
              required: ["name"]
            }
          }
        },
        required: ["title", "description", "prepTime", "ingredients", "instructions", "missingIngredients"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateDailyDietPlan = async (profile: UserProfile, pantryItems: string[]): Promise<DietPlan> => {
  await verifyApiKey();
  const ai = await getAI();
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are an AI Clinical Dietitian and Nutritionist specializing in Bangladeshi and Global diets for the ElaChef application.
    Create a personalized 1-day diet plan based on the user's profile and what they have in their pantry.
    
    User Profile:
    - Name: ${profile.name}
    - Age/Gender: ${profile.age}, ${profile.gender}
    - Weight/Height: ${profile.weight}kg, ${profile.height}cm
    - Activity: ${profile.activityLevel}
    - Daily Calorie Target: ${profile.dailyGoal} kcal

    Pantry Context (Prioritize these ingredients for recipes):
    ${pantryItems.join(", ")}

    Guidelines:
    1. Distribute calories roughly: 25% Breakfast, 35% Lunch, 25% Dinner, 15% Snacks.
    2. Focus on balanced macros (roughly 45-55% Carbs, 20-25% Protein, 25-30% Fat).
    3. Include Bangladeshi favorites where possible (e.g., Lal Chal, Dal, Macher Jhol, Bhorta) but keep them healthy.
    4. Provide specific nutritional values for each meal.
    5. Include brief, professional dietary advice.
    
    Output must be JSON.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: "Generate a complete daily diet plan including Breakfast, Lunch, Dinner, and a Snack.",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                nutrition: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER }
                  },
                  required: ["calories", "protein", "carbs", "fat"]
                }
              },
              required: ["type", "name", "description", "nutrition"]
            }
          },
          totalNutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            }
          },
          advice: { type: Type.STRING }
        },
        required: ["meals", "totalNutrition", "advice"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
