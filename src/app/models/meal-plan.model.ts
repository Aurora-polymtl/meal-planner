export interface MealPlan {
  id: string;
  startDate: string; // ISO (début de semaine)
  days: DayPlan[];
}

export interface DayPlan {
  date: string; // ISO date YYYY-MM-DD
  meals: string[]; // ids des meals
}