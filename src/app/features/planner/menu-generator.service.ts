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
  categoryConstraints?: SlotCategoryConstraint[];
  slotSelections?: SlotGenerationSelection[];
}

export interface SlotCategoryConstraint {
  date: string;
  slot: 'dinner' | 'supper';
  categories: string[];
}

export interface SlotGenerationSelection {
  date: string;
  slot: 'dinner' | 'supper';
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuGeneratorService {
  generateDays(
    options: MenuGenerationOptions,
    meals: Meal[],
    existingPlans: MealPlan[] = [],
  ): DayPlan[] {
    const start = this.parseIsoDate(options.startDate);
    const numberOfDays = Math.max(1, Math.min(options.numberOfDays, 31));
    const generatedDays: DayPlan[] = [];

    for (let i = 0; i < numberOfDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const usedToday = new Set<string>();

      const dinnerMealId = this.shouldGenerateSlot(date, 'dinner', options)
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

      const supperMealId = this.shouldGenerateSlot(date, 'supper', options)
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

  private shouldGenerateSlot(
    date: Date,
    slot: 'dinner' | 'supper',
    options: MenuGenerationOptions,
  ): boolean {
    const dateIso = this.toIsoDate(date);

    const selection = options.slotSelections?.find(
      (slotSelection) => slotSelection.date === dateIso && slotSelection.slot === slot,
    );

    if (selection) {
      return selection.enabled;
    }

    return slot === 'dinner' ? options.generateDinner : options.generateSupper;
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
    const compatibleMeals = meals.filter((meal) => this.isCompatibleWithSlot(meal, slot));

    if (compatibleMeals.length === 0) {
      throw new Error(
        `Aucun plat disponible pour ${slot === 'dinner' ? 'les dîners' : 'les soupers'}.`,
      );
    }

    const requiredCategories = this.getRequiredCategories(date, slot, options);

    const categoryValidMeals =
      requiredCategories.length > 0
        ? compatibleMeals.filter((meal) =>
            requiredCategories.every((category) => meal.categories.includes(category)),
          )
        : compatibleMeals;

    const requiredCategoriesLabel = requiredCategories.join(', ');

    if (categoryValidMeals.length === 0) {
      throw new Error(
        `Aucun plat ne correspond à la catégorie "${requiredCategoriesLabel}" pour ${
          slot === 'dinner' ? 'le dîner' : 'le souper'
        }.`,
      );
    }

    const repeatValidMeals = categoryValidMeals.filter((meal) => {
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
        requiredCategoriesLabel
          ? `Aucun plat de la catégorie "${requiredCategoriesLabel}" ne respecte les règles de répétition pour ${
              slot === 'dinner' ? 'le dîner' : 'le souper'
            }.`
          : 'Pas assez de plats différents pour respecter la règle de répétition sélectionnée.',
      );
    }

    const bestCandidates = requiredCategoriesLabel
      ? repeatValidMeals
      : this.applyCategoryPriorities(repeatValidMeals, date);

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
        const dayDate = this.parseIsoDate(day.date);

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
      const dayDate = this.parseIsoDate(day.date);

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
    const start = this.parseIsoDate(options.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + options.numberOfDays - 1);

    const dayDate = this.parseIsoDate(day.date);

    if (dayDate < this.startOfDay(start) || dayDate > this.startOfDay(end)) {
      return false;
    }

    return options.generateDinner || options.generateSupper;
  }

  private applyCategoryPriorities(meals: Meal[], date: Date): Meal[] {
    const seasonCompatibleMeals = meals.filter((meal) => this.matchesSeasonPriority(meal, date));

    const seasonCandidates = seasonCompatibleMeals.length > 0 ? seasonCompatibleMeals : meals;

    const dayCompatibleMeals = seasonCandidates.filter((meal) => this.isAllowedForDay(meal, date));

    const dayCandidates = dayCompatibleMeals.length > 0 ? dayCompatibleMeals : seasonCandidates;

    const preferredDayCategory = this.getPreferredDayCategory(date);

    const preferredMeals = dayCandidates.filter((meal) =>
      meal.categories.includes(preferredDayCategory),
    );

    return preferredMeals.length > 0 ? preferredMeals : dayCandidates;
  }

  private isAllowedForDay(meal: Meal, date: Date): boolean {
    const day = date.getDay();

    const isFriday = day === 5;
    const isWeekend = day === 0 || day === 6;

    const hasFridayCategory = meal.categories.includes('Vendredi');
    const hasWeekendCategory = meal.categories.includes('Fin de semaine');

    if (hasFridayCategory && !isFriday) {
      return false;
    }

    if (hasWeekendCategory && !isWeekend) {
      return false;
    }

    return true;
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

  private parseIsoDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getRequiredCategories(
    date: Date,
    slot: 'dinner' | 'supper',
    options: MenuGenerationOptions,
  ): string[] {
    const dateIso = this.toIsoDate(date);

    return (
      options.categoryConstraints?.find(
        (constraint) =>
          constraint.date === dateIso &&
          constraint.slot === slot &&
          constraint.categories.length > 0,
      )?.categories ?? []
    );
  }
}
