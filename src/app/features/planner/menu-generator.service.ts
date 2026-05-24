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

      const usedToday = new Set<string>();

      const dinnerMealId = options.generateDinner
        ? this.pickMealId(
            'dinner',
            date,
            start,
            meals,
            existingPlans,
            generatedDays,
            usedToday,
            options,
          )
        : null;

      if (dinnerMealId) {
        usedToday.add(dinnerMealId);
      }

      const supperMealId = options.generateSupper
        ? this.pickMealId(
            'supper',
            date,
            start,
            meals,
            existingPlans,
            generatedDays,
            usedToday,
            options,
          )
        : null;

      generatedDays.push({
        date: this.toIsoDate(date),
        dinnerMealId,
        supperMealId,
      });
    }

    return generatedDays;
  }

  private pickMealId(
    slot: 'dinner' | 'supper',
    date: Date,
    generationStart: Date,
    meals: Meal[],
    existingPlans: MealPlan[],
    generatedDays: DayPlan[],
    usedToday: Set<string>,
    options: MenuGenerationOptions,
  ): string {
    const compatibleMeals = meals.filter((meal) =>
      this.isCompatibleWithSlot(meal, slot),
    );

    if (compatibleMeals.length === 0) {
      throw new Error(
        `Aucun plat disponible pour ${slot === 'dinner' ? 'les dîners' : 'les soupers'}.`,
      );
    }

    const repeatValidMeals = compatibleMeals.filter((meal) => {
      return (
        !usedToday.has(meal.id) &&
        this.respectsRepeatRestriction(
          meal.id,
          date,
          generationStart,
          existingPlans,
          generatedDays,
          options,
        )
      );
    });

    if (repeatValidMeals.length === 0) {
      throw new Error(
        'Pas assez de plats différents pour respecter la règle de répétition sélectionnée.',
      );
    }

    const bestCandidates = this.applyCategoryPriorities(repeatValidMeals, date);

    return this.pickRandom(bestCandidates).id;
  }

  private respectsRepeatRestriction(
    mealId: string,
    currentDate: Date,
    generationStart: Date,
    existingPlans: MealPlan[],
    generatedDays: DayPlan[],
    options: MenuGenerationOptions,
  ): boolean {
    if (options.repeatRestriction === 'none') {
      return true;
    }

    if (!this.isDateInRestrictionWindow(currentDate, generationStart, options.repeatRestriction)) {
      return true;
    }

    const existingMealIds = existingPlans.flatMap((plan) =>
      plan.days.flatMap((day) => {
        const dayDate = new Date(day.date);

        if (!this.isDateInRestrictionWindow(dayDate, generationStart, options.repeatRestriction)) {
          return [];
        }

        if (this.isDayBeingRegenerated(day, options)) {
          return [];
        }

        return [day.dinnerMealId, day.supperMealId];
      }),
    );

    const generatedMealIds = generatedDays.flatMap((day) => {
      const dayDate = new Date(day.date);

      if (!this.isDateInRestrictionWindow(dayDate, generationStart, options.repeatRestriction)) {
        return [];
      }

      return [day.dinnerMealId, day.supperMealId];
    });

    return ![...existingMealIds, ...generatedMealIds].includes(mealId);
  }

  private isDateInRestrictionWindow(
    date: Date,
    generationStart: Date,
    repeatRestriction: RepeatRestriction,
  ): boolean {
    const normalizedDate = this.startOfDay(date);
    const normalizedStart = this.startOfDay(generationStart);

    const diffInDays = Math.floor(
      (normalizedDate.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (repeatRestriction === 'week') {
      return diffInDays >= 0 && diffInDays <= 6;
    }

    if (repeatRestriction === 'twoWeeks') {
      return diffInDays >= -7 && diffInDays <= 6;
    }

    return true;
  }

  private isDayBeingRegenerated(day: DayPlan, options: MenuGenerationOptions): boolean {
    const start = new Date(options.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + options.numberOfDays - 1);

    const dayDate = new Date(day.date);

    if (dayDate < this.startOfDay(start) || dayDate > this.startOfDay(end)) {
      return false;
    }

    return options.generateDinner || options.generateSupper;
  }

  private applyCategoryPriorities(meals: Meal[], date: Date): Meal[] {
    const seasonalMatches = meals.filter((meal) =>
      this.matchesSeasonPriority(meal, date),
    );

    const seasonCandidates = seasonalMatches.length > 0 ? seasonalMatches : meals;

    const dayCategory = this.getPreferredDayCategory(date);
    const dayMatches = seasonCandidates.filter((meal) =>
      meal.categories.includes(dayCategory),
    );

    return dayMatches.length > 0 ? dayMatches : seasonCandidates;
  }

  private getPreferredDayCategory(date: Date): 'Semaine' | 'Vendredi' | 'Fin de semaine' {
    const day = date.getDay();

    if (day === 5) return 'Vendredi';
    if (day === 0 || day === 6) return 'Fin de semaine';

    return 'Semaine';
  }

  private matchesSeasonPriority(meal: Meal, date: Date): boolean {
    const month = date.getMonth() + 1;

    const isWinterPeriod = month >= 11 || month <= 4;
    const isSummerPeriod = month >= 5 && month <= 10;

    const isSummerMeal = meal.categories.includes('Été');
    const isWinterMeal = meal.categories.includes('Hiver');

    if (isWinterPeriod && isSummerMeal) return false;
    if (isSummerPeriod && isWinterMeal) return false;

    return true;
  }

  private isCompatibleWithSlot(meal: Meal, slot: 'dinner' | 'supper'): boolean {
    const usage = meal.mealUsage ?? 'both';
    return usage === 'both' || usage === slot;
  }

  private pickRandom(meals: Meal[]): Meal {
    const index = Math.floor(Math.random() * meals.length);
    return meals[index];
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}