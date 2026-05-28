import { Injectable } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase.config';
import { AuthService } from '../auth/auth.service.ts';
import {
  GroceryIngredient,
  GroceryList,
  GroceryMealSection,
} from '../../models/grocery-list.model';
import { Meal } from '../../models/meal';
import { MealPlan } from '../../models/meal-plan.model';
import { generateId } from '../../core/utils/id.utils';

@Injectable({ providedIn: 'root' })
export class GroceryListService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<GroceryList[]> {
    const user = await this.authService.getCurrentUser();
    const listsRef = collection(firestore, `users/${user.uid}/groceryLists`);
    const snapshot = await getDocs(listsRef);

    return snapshot.docs
      .map((docSnap) => docSnap.data() as GroceryList)
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }

  async save(list: GroceryList): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const listRef = doc(firestore, `users/${user.uid}/groceryLists/${list.id}`);

    await setDoc(listRef, list);
  }

  async delete(id: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const listRef = doc(firestore, `users/${user.uid}/groceryLists/${id}`);

    await deleteDoc(listRef);
  }

  async createFromPlan(plan: MealPlan, meals: Meal[]): Promise<void> {
    const sections: GroceryMealSection[] = [];

    for (const day of plan.days) {
      if (day.dinnerMealId) {
        const meal = meals.find((m) => m.id === day.dinnerMealId);

        if (meal) {
          sections.push(this.createSection(day.date, 'dinner', meal));
        }
      }

      if (day.supperMealId) {
        const meal = meals.find((m) => m.id === day.supperMealId);

        if (meal) {
          sections.push(this.createSection(day.date, 'supper', meal));
        }
      }
    }

    const groceryList: GroceryList = {
      id: plan.id,
      planId: plan.id,
      startDate: plan.startDate,
      sections,
      createdAt: new Date().toISOString(),
    };

    await this.save(groceryList);
  }

  private createSection(date: string, slot: 'dinner' | 'supper', meal: Meal): GroceryMealSection {
    return {
      id: generateId(),
      date,
      slot,
      mealId: meal.id,
      mealName: meal.name,
      ingredients: (meal.ingredients ?? []).map((ingredient) => ({
        id: generateId(),
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      })),
    };
  }

  getCombinedIngredients(list: GroceryList): GroceryIngredient[] {
    const ingredientsByKey = new Map<string, GroceryIngredient>();

    for (const section of list.sections) {
      for (const ingredient of section.ingredients) {
        const name = ingredient.name.trim();
        const unit = ingredient.unit.trim();

        if (!name) continue;

        const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
        const existing = ingredientsByKey.get(key);

        if (existing) {
          existing.quantity += Number(ingredient.quantity) || 0;
        } else {
          ingredientsByKey.set(key, {
            id: key,
            name,
            quantity: Number(ingredient.quantity) || 0,
            unit,
          });
        }
      }
    }

    return [...ingredientsByKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
}
