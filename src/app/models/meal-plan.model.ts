export interface MealPlan {
  id: string;
  startDate: string;
  days: DayPlan[];
}

export interface DayPlan {
  date: string;

  dinnerMealId: string | null;
  supperMealId: string | null;
}