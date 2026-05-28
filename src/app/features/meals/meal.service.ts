import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase.config';
import { Meal } from '../../models/meal';
import { AuthService } from '../auth/auth.service.ts';
import { generateId } from '../../core/utils/id.utils';

@Injectable({ providedIn: 'root' })
export class MealService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<Meal[]> {
    const user = await this.authService.getCurrentUser();
    const mealsRef = collection(firestore, `users/${user.uid}/meals`);
    const snapshot = await getDocs(mealsRef);

    return snapshot.docs.map((docSnap) => docSnap.data() as Meal);
  }

  async add(meal: Meal): Promise<void> {
    const user = await this.authService.getCurrentUser();

    const mealWithId: Meal = {
      ...meal,
      id: meal.id || generateId(),
    };

    const mealRef = doc(firestore, `users/${user.uid}/meals/${mealWithId.id}`);
    await setDoc(mealRef, mealWithId);
  }

  async delete(id: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const mealRef = doc(firestore, `users/${user.uid}/meals/${id}`);

    await deleteDoc(mealRef);
  }

  async update(meal: Meal): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const mealRef = doc(firestore, `users/${user.uid}/meals/${meal.id}`);

    await setDoc(mealRef, meal);
  }
}