import { Injectable } from '@angular/core';
import { db } from '../../db/app.db';
import { Category } from '../../models/category';

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
  async getAll() {
    const categories = await db.categories.orderBy('name').toArray();

    if (categories.length === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES);
      return db.categories.orderBy('name').toArray();
    }

    return categories;
  }

  async add(name: string) {
    const cleanName = name.trim();

    if (!cleanName) return;

    await db.categories.put({ name: cleanName });
  }

  delete(name: string) {
    return db.categories.delete(name);
  }
}