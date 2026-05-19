import { Injectable } from '@angular/core';
import { Meal } from '../../models/meal';

export interface MealErrors {
  name?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class MealValidationService {

  private textRegex = /^[A-Za-zÀ-ÿ\s]+$/;

  validateMeal(name: string, category: string, meals: Meal[]): MealErrors {
    const errors: MealErrors = {};

    const cleanName = name.trim();
    const cleanCategory = category.trim();

    // champs vides
    if (!cleanName) {
      errors.name = 'Le nom du plat est requis.';
    }

    if (!cleanCategory) {
      errors.category = 'La catégorie est requise.';
    }

    // format nom
    if (cleanName && !this.textRegex.test(cleanName)) {
      errors.name = 'Seulement des lettres et des espaces.';
    }

    // format catégorie
    if (cleanCategory && !this.textRegex.test(cleanCategory)) {
      errors.category = 'Seulement des lettres et des espaces.';
    }

    // doublon
    if (
      cleanName &&
      meals.some(
        m => m.name.toLowerCase() === cleanName.toLowerCase()
      )
    ) {
      errors.name = 'Ce plat existe déjà.';
    }

    return errors;
  }
}