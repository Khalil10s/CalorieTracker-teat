export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  barcode?: string;
  imageURL?: string;
  isPartialData: boolean;
  isFavorite?: boolean;
}

export interface MealEntry {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  quantity: number;
  mealType: MealType;
  date: number; // timestamp
  createdAt: number;
}

export interface WeightEntry {
  id: string;
  weight: number;
  date: number;
  createdAt: number;
}

export interface WaterEntry {
  id: string;
  amount: number; // ml
  date: number;
  createdAt: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  servings: number;
  createdAt: number;
}

export interface RecipeIngredient {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type WeightUnit = 'kg' | 'lbs';

export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'eat_healthy';
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'partly_active' | 'active' | 'exercise_regularly';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  weightUnit: WeightUnit;
  hasCompletedOnboarding: boolean;
  waterGoal?: number; // ml, default 2000
  height?: number; // cm
  profilePhoto?: string; // base64 uri
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:MM
  // Onboarding fields
  fitnessGoal?: FitnessGoal;
  gender?: Gender;
  age?: number;
  currentWeight?: number;
  goalWeight?: number;
  importantTo?: string[];
  challenges?: string[];
  activityLevel?: ActivityLevel;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  entries: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export const MEAL_TYPES: { type: MealType; label: string; icon: string; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#FF9500' },
  { type: 'lunch', label: 'Lunch', icon: '☀️', color: '#FFCC00' },
  { type: 'dinner', label: 'Dinner', icon: '🌙', color: '#5856D6' },
  { type: 'snack', label: 'Snack', icon: '🍃', color: '#34C759' },
];

export const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'email' | 'displayName'> = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
  weightUnit: 'kg',
  hasCompletedOnboarding: false,
};
