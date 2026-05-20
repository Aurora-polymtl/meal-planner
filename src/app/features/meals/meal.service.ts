import { Injectable } from '@angular/core';
import { db } from '../../db/app.db';
import { Meal } from '../../models/meal';

@Injectable({ providedIn: 'root' })
export class MealService {

  getAll() {
    return db.meals.toArray();
  }

  add(meal: Meal) {
    return db.meals.add(meal);
  }

  delete(id: string) {
    return db.meals.delete(id);
  }

  update(meal: Meal) {
    return db.meals.put(meal);
  }
}