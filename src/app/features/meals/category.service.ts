import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase.config';
import { Category } from '../../models/category';
import { AuthService } from '../auth/auth.service.ts';

const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Rapide' },
  { name: 'Santé' },
  { name: 'Végétarien' },
  { name: 'Fin de semaine' },
  { name: 'Junk' },
  { name: 'Semaine' },
  { name: 'Vendredi' },
  { name: 'Été' },
  { name: 'Hiver' },
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<Category[]> {
    const user = await this.authService.getCurrentUser();
    const categoriesRef = collection(firestore, `users/${user.uid}/categories`);
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.empty) {
      await this.createDefaultCategories();
      return this.sortCategories(DEFAULT_CATEGORIES);
    }

    return this.sortCategories(
      snapshot.docs.map((docSnap) => docSnap.data() as Category),
    );
  }

  async add(name: string): Promise<void> {
    const cleanName = name.trim();

    if (!cleanName) return;

    const user = await this.authService.getCurrentUser();
    const categoryRef = doc(
      firestore,
      `users/${user.uid}/categories/${cleanName}`,
    );

    await setDoc(categoryRef, { name: cleanName });
  }

  async delete(name: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const categoryRef = doc(firestore, `users/${user.uid}/categories/${name}`);

    await deleteDoc(categoryRef);
  }

  private async createDefaultCategories(): Promise<void> {
    const user = await this.authService.getCurrentUser();

    for (const category of DEFAULT_CATEGORIES) {
      const categoryRef = doc(
        firestore,
        `users/${user.uid}/categories/${category.name}`,
      );

      await setDoc(categoryRef, category);
    }
  }

  private sortCategories(categories: Category[]): Category[] {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }
}