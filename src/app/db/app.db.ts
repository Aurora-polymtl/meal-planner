import Dexie, { Table } from 'dexie';
import { Meal } from '../models/meal';

export class AppDB extends Dexie {
  meals!: Table<Meal, string>;

  constructor() {
    super('MealPlannerDB');

    this.version(1).stores({
      meals: 'id, name, category'
    });
  }
}

export const db = new AppDB();