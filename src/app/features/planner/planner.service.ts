import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase.config';
import { MealPlan } from '../../models/meal-plan.model';
import { MealService } from '../meals/meal.service';
import {
  MenuGenerationOptions,
  MenuGeneratorService,
} from './menu-generator.service';
import { AuthService } from '../auth/auth.service.ts';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  constructor(
    private mealService: MealService,
    private menuGenerator: MenuGeneratorService,
    private authService: AuthService,
  ) {}

  async getPlans(): Promise<MealPlan[]> {
    const user = await this.authService.getCurrentUser();
    const plansRef = collection(firestore, `users/${user.uid}/mealPlans`);
    const snapshot = await getDocs(plansRef);

    return snapshot.docs.map((docSnap) => docSnap.data() as MealPlan);
  }

  async addPlan(plan: MealPlan): Promise<void> {
    const user = await this.authService.getCurrentUser();

    const planWithId: MealPlan = {
      ...plan,
      id: plan.id || crypto.randomUUID(),
    };

    const planRef = doc(firestore, `users/${user.uid}/mealPlans/${planWithId.id}`);
    await setDoc(planRef, planWithId);
  }

  async updatePlan(plan: MealPlan): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const planRef = doc(firestore, `users/${user.uid}/mealPlans/${plan.id}`);

    await setDoc(planRef, plan);
  }

  async deletePlan(id: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const planRef = doc(firestore, `users/${user.uid}/mealPlans/${id}`);

    await deleteDoc(planRef);
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
      days: this.menuGenerator.generateDays(options, meals, await this.getPlans()),
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

  async confirmPlan(plan: MealPlan, overwriteConflicts = false): Promise<void> {
    const hasConflicts = await this.hasConflicts(plan);

    if (hasConflicts && !overwriteConflicts) {
      throw new Error('CONFLICT');
    }

    if (overwriteConflicts) {
      await this.clearConflictingMeals(plan);
    }

    await this.addPlan(plan);
  }

  private async clearConflictingMeals(newPlan: MealPlan): Promise<void> {
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