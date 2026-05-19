import Dexie, { Table } from 'dexie';
import { Meal } from '../models/meal';
import { MealPlan } from '../models/meal-plan.model';

export class AppDB extends Dexie {

  meals!: Table<Meal, string>;
  plans!: Table<MealPlan, string>;

  constructor() {
    super('AppDB');

    this.version(1).stores({
      meals: 'id, name, category'
    });

    this.version(2).stores({
      meals: 'id, name, category',
      plans: 'id, startDate'
    });

    this.meals = this.table('meals');
    this.plans = this.table('plans');
  }
}

export const db = new AppDB();