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

  updatePlan(plan: MealPlan) {
    return db.plans.put(plan);
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

  async hasConflicts(plan: MealPlan): Promise<boolean> {
    const existingPlans = await this.getPlans();

    return existingPlans.some((existingPlan) =>
      existingPlan.days.some((existingDay) => {
        const newDay = plan.days.find((day) => day.date === existingDay.date);

        if (!newDay) return false;

        const dinnerConflict =
          !!newDay.dinnerMealId && !!existingDay.dinnerMealId;

        const supperConflict =
          !!newDay.supperMealId && !!existingDay.supperMealId;

        return dinnerConflict || supperConflict;
      }),
    );
  }

  async confirmPlan(plan: MealPlan, overwriteConflicts = false) {
    const hasConflicts = await this.hasConflicts(plan);

    if (hasConflicts && !overwriteConflicts) {
      throw new Error('CONFLICT');
    }

    if (overwriteConflicts) {
      await this.clearConflictingMeals(plan);
    }

    await this.addPlan(plan);
  }

  private async clearConflictingMeals(newPlan: MealPlan) {
    const existingPlans = await this.getPlans();

    for (const existingPlan of existingPlans) {
      let planChanged = false;

      const updatedDays = existingPlan.days
        .map((existingDay) => {
          const newDay = newPlan.days.find((day) => day.date === existingDay.date);

          if (!newDay) return existingDay;

          const updatedDay = { ...existingDay };

          if (newDay.dinnerMealId && updatedDay.dinnerMealId) {
            updatedDay.dinnerMealId = null;
            planChanged = true;
          }

          if (newDay.supperMealId && updatedDay.supperMealId) {
            updatedDay.supperMealId = null;
            planChanged = true;
          }

          return updatedDay;
        })
        .filter((day) => day.dinnerMealId || day.supperMealId);

      if (!planChanged) continue;

      if (updatedDays.length === 0) {
        await this.deletePlan(existingPlan.id);
      } else {
        await this.updatePlan({
          ...existingPlan,
          days: updatedDays,
        });
      }
    }
  }
}