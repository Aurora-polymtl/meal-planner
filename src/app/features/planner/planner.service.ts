import { Injectable } from '@angular/core';
import { db } from '../../db/app.db';
import { MealPlan } from '../../models/meal-plan.model';
import { MealService } from '../meals/meal.service';
import {
  MenuGenerationOptions,
  MenuGeneratorService,
} from './menu-generator.service';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  constructor(
    private mealService: MealService,
    private menuGenerator: MenuGeneratorService,
  ) {}

  getPlans() {
    return db.plans.toArray();
  }

  addPlan(plan: MealPlan) {
    return db.plans.add(plan);
  }

  deletePlan(id: string) {
    return db.plans.delete(id);
  }

  async generatePlanPreview(options: MenuGenerationOptions): Promise<MealPlan> {
    if (!options.startDate) {
      throw new Error('Choisis une date de départ.');
    }

    if (!options.generateDinner && !options.generateSupper) {
      throw new Error('Choisis au moins un type de repas à générer.');
    }

    const meals = await this.mealService.getAll();

    if (meals.length === 0) {
      throw new Error('Ajoute au moins un plat avant de générer un menu.');
    }

    return {
      id: crypto.randomUUID(),
      startDate: options.startDate,
      days: this.menuGenerator.generateDays(options, meals),
    };
  }

  async confirmPlan(plan: MealPlan) {
    await this.addPlan(plan);
  }
}