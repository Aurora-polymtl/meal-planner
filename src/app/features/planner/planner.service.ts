import { Injectable } from '@angular/core';
import { db } from '../../db/app.db';
import { MealPlan } from '../../models/meal-plan.model';

@Injectable({ providedIn: 'root' })
export class PlannerService {

  getPlans() {
    return db.plans.toArray();
  }

  addPlan(plan: MealPlan) {
    return db.plans.add(plan);
  }

  deletePlan(id: string) {
    return db.plans.delete(id);
  }
}