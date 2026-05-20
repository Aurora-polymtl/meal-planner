import { Injectable } from '@angular/core';
import { Meal } from '../../models/meal';

export interface MealErrors {
  name?: string;
  category?: string;
  ingredient?: string;
}

@Injectable({ providedIn: 'root' })
export class MealValidationService {

  private textRegex = /^[A-Za-zÀ-ÿ\s'-]+$/;

  validateMeal(
    name: string,
    categories: string[],
    meals: Meal[]
  ): MealErrors {

    const errors: MealErrors = {};

    const cleanName = name.trim();

    // nom vide
    if (!cleanName) {
      errors.name = 'Le nom du plat est requis.';
    }

    // format nom
    if (cleanName && !this.textRegex.test(cleanName)) {
      errors.name = 'Seulement des lettres et des espaces.';
    }

    // doublon nom
    if (
      cleanName &&
      meals.some(
        m => m.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      errors.name = 'Ce plat existe déjà.';
    }

    // catégories
    if (categories.length === 0) {
      errors.category = 'Au moins une catégorie est requise.';
    }

    return errors;
  }

  validateCategory(category: string): string | null {

    const cleanCategory = category.trim();

    if (!cleanCategory) {
      return 'La catégorie est requise.';
    }

    if (!this.textRegex.test(cleanCategory)) {
      return 'Seulement des lettres et des espaces.';
    }

    return null;
  }

  validateIngredient(
    name: string,
    quantity: string,
    unit: string
  ): string | null {

    const cleanName = name.trim();

    const anyFieldFilled =
      cleanName || quantity || unit;

    // ingrédient complètement vide → OK
    if (!anyFieldFilled) {
      return null;
    }

    // validation complète
    if (!cleanName || !quantity || !unit) {
      return 'Tous les champs de l’ingrédient doivent être remplis.';
    }

    if (!this.textRegex.test(cleanName)) {
      return 'Nom d’ingrédient invalide.';
    }

    return null;
  }
}