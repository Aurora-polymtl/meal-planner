import { Component, OnInit } from '@angular/core';
import { MealService } from '../meal.service';
import { Meal } from '../../../models/meal';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-meal-list',
  standalone: true,
  templateUrl: './meal-list.html',
  imports: [FormsModule],
})
export class MealListComponent implements OnInit {
  meals: Meal[] = [];

  name: string = '';
  category: string = '';

  constructor(
    private mealService: MealService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadMeals();
  }

  async loadMeals() {
    const data = await this.mealService.getAll();
    this.meals = data;

    this.cdr.detectChanges();
  }

  async addMeal() {
    if (!this.name || !this.category) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: this.name,
      category: this.category,
    };

    await this.mealService.add(newMeal);

    this.name = '';
    this.category = '';

    await this.loadMeals();

    this.cdr.detectChanges();
  }

  async deleteMeal(id: string) {
    await this.mealService.delete(id);

    await this.loadMeals();

    this.cdr.detectChanges();
  }
}
