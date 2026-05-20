import { Injectable } from '@angular/core';
import { DayPlan } from '../../models/meal-plan.model';
import { Meal } from '../../models/meal';

export interface MenuGenerationOptions {
  startDate: string;
  numberOfDays: number;
  generateDinner: boolean;
  generateSupper: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuGeneratorService {
  generateDays(options: MenuGenerationOptions, meals: Meal[]): DayPlan[] {
    const start = new Date(options.startDate);
    const numberOfDays = Math.max(1, Math.min(options.numberOfDays, 31));

    return Array.from({ length: numberOfDays }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        date: this.toIsoDate(date),
        dinnerMealId: options.generateDinner ? this.pickRandomMealId(meals) : null,
        supperMealId: options.generateSupper ? this.pickRandomMealId(meals) : null,
      };
    });
  }

  private pickRandomMealId(meals: Meal[]): string {
    const index = Math.floor(Math.random() * meals.length);
    return meals[index].id;
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}