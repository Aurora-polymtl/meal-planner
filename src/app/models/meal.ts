export type MealUsage = 'dinner' | 'supper' | 'both';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  name: string;
  categories: string[];
  mealUsage?: MealUsage; // ancien repas = considéré comme both
  ingredients?: Ingredient[];
}