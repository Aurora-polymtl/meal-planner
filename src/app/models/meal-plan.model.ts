export interface MealPlan {
  id: string;
  startDate: string;
  days: DayPlan[];
}

export interface DayPlan {
  date: string;

  dinner: string | null; // Dîner
  supper: string | null; // Souper
}