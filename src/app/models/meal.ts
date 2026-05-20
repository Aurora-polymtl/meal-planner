export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  name: string;
  categories: string[];
  ingredients?: Ingredient[];
}