import { Injectable } from '@angular/core';
import { DayPlan, MealPlan } from '../../models/meal-plan.model';
import { Meal } from '../../models/meal';

export type RepeatRestriction = 'none' | 'week' | 'twoWeeks';

export interface MenuGenerationOptions {
  startDate: string;
  numberOfDays: number;
  generateDinner: boolean;
  generateSupper: boolean;
  repeatRestriction: RepeatRestriction;
}

@Injectable({ providedIn: 'root' })
export class MenuGeneratorService {
  generateDays(
    options: MenuGenerationOptions,
    meals: Meal[],
    existingPlans: MealPlan[] = [],
  ): DayPlan[] {
    const start = new Date(options.startDate);
    const numberOfDays = Math.max(1, Math.min(options.numberOfDays, 31));

    const generatedDays: DayPlan[] = [];

    for (let i = 0; i < numberOfDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const dateIso = this.toIsoDate(date);
      const usedToday = new Set<string>();

      const dinnerMealId = options.generateDinner
        ? this.pickMealId('dinner', date, meals, existingPlans, generatedDays, usedToday, options.repeatRestriction)
        : null;

      if (dinnerMealId) {
        usedToday.add(dinnerMealId);
      }

      const supperMealId = options.generateSupper
        ? this.pickMealId('supper', date, meals, existingPlans, generatedDays, usedToday, options.repeatRestriction)
        : null;

      generatedDays.push({
        date: dateIso,
        dinnerMealId,
        supperMealId,
      });
    }

    return generatedDays;
  }

  private pickMealId(
    slot: 'dinner' | 'supper',
    date: Date,
    meals: Meal[],
    existingPlans: MealPlan[],
    generatedDays: DayPlan[],
    usedToday: Set<string>,
    repeatRestriction: RepeatRestriction,
  ): string {
    const compatibleMeals = meals.filter((meal) =>
      this.isCompatibleWithSlot(meal, slot),
    );

    if (compatibleMeals.length === 0) {
      throw new Error(`Aucun plat disponible pour ${slot === 'dinner' ? 'les dîners' : 'les soupers'}.`);
    }

    const strictCandidates = compatibleMeals.filter((meal) =>
      !usedToday.has(meal.id) &&
      this.respectsRepeatRestriction(meal.id, date, existingPlans, generatedDays, repeatRestriction),
    );

    if (strictCandidates.length > 0) {
      return this.pickRandom(strictCandidates).id;
    }

    const sameDayOnlyCandidates = compatibleMeals.filter((meal) => !usedToday.has(meal.id));

    if (sameDayOnlyCandidates.length > 0 && repeatRestriction === 'none') {
      return this.pickRandom(sameDayOnlyCandidates).id;
    }

    throw new Error(
      `Pas assez de plats différents pour respecter la règle de répétition sélectionnée.`,
    );
  }

  private isCompatibleWithSlot(meal: Meal, slot: 'dinner' | 'supper'): boolean {
    const usage = meal.mealUsage ?? 'both';

    return usage === 'both' || usage === slot;
  }

  private respectsRepeatRestriction(
    mealId: string,
    date: Date,
    existingPlans: MealPlan[],
    generatedDays: DayPlan[],
    repeatRestriction: RepeatRestriction,
  ): boolean {
    if (repeatRestriction === 'none') return true;

    const targetPeriod = this.getPeriodKey(date, repeatRestriction);

    const existingMealIds = existingPlans.flatMap((plan) =>
      plan.days
        .filter((day) => this.getPeriodKey(new Date(day.date), repeatRestriction) === targetPeriod)
        .flatMap((day) => [day.dinnerMealId, day.supperMealId]),
    );

    const generatedMealIds = generatedDays
      .filter((day) => this.getPeriodKey(new Date(day.date), repeatRestriction) === targetPeriod)
      .flatMap((day) => [day.dinnerMealId, day.supperMealId]);

    return ![...existingMealIds, ...generatedMealIds].includes(mealId);
  }

  private getPeriodKey(date: Date, repeatRestriction: Exclude<RepeatRestriction, 'none'>): string {
    const monday = this.getMonday(date);

    if (repeatRestriction === 'week') {
      return this.toIsoDate(monday);
    }

    const epochMonday = this.getMonday(new Date('2024-01-01'));
    const diffInDays = Math.floor(
      (monday.getTime() - epochMonday.getTime()) / (1000 * 60 * 60 * 24),
    );

    const twoWeekIndex = Math.floor(diffInDays / 14);
    return `two-weeks-${twoWeekIndex}`;
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);

    return new Date(d.setDate(diff));
  }

  private pickRandom(meals: Meal[]): Meal {
    const index = Math.floor(Math.random() * meals.length);
    return meals[index];
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}