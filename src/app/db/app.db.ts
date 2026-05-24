import Dexie, { Table } from 'dexie';
import { Meal } from '../models/meal';
import { MealPlan } from '../models/meal-plan.model';
import { Category } from '../models/category';

const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Rapide' },
  { name: 'Santé' },
  { name: 'Végétarien' },
  { name: 'Fin de semaine' },
  { name: 'Junk' },
  { name: 'Semaine' },
  { name: 'Vendredi' },
  { name: 'Été' },
  { name: 'Hiver' },
];

export class AppDB extends Dexie {
  meals!: Table<Meal, string>;
  plans!: Table<MealPlan, string>;
  categories!: Table<Category, string>;

  constructor() {
    super('AppDB');

    this.version(1).stores({
      meals: 'id, name, category',
    });

    this.version(2).stores({
      meals: 'id, name, category',
      plans: 'id, startDate',
    });

    this.version(3).stores({
      meals: 'id, name',
      plans: 'id, startDate',
    });

    this.version(4)
      .stores({
        meals: 'id, name',
        plans: 'id, startDate',
        categories: 'name',
      })
      .upgrade(async (tx) => {
        await tx.table('categories').bulkAdd(DEFAULT_CATEGORIES);
      });

    this.meals = this.table('meals');
    this.plans = this.table('plans');
    this.categories = this.table('categories');
  }
}

export const db = new AppDB();