export interface GroceryList {
  id: string;
  planId: string;
  startDate: string;
  sections: GroceryMealSection[];
  createdAt: string;
}

export interface GroceryMealSection {
  id: string;
  date: string;
  slot: 'dinner' | 'supper';
  mealId: string;
  mealName: string;
  ingredients: GroceryIngredient[];
}

export interface GroceryIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}