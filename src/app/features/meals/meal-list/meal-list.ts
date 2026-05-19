import { Component, OnInit } from '@angular/core';
import { MealService } from '../meal';
import { Meal } from '../../../models/meal';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-meal-list',
  templateUrl: './meal-list.html',
  imports: [FormsModule]
})
export class MealListComponent implements OnInit {

  meals: Meal[] = [];

  name: string = '';
  category: string = '';

  constructor(private mealService: MealService) {}

  async ngOnInit() {
    await this.loadMeals();
  }

  async loadMeals() {
    this.meals = await this.mealService.getAll();
  }

  async addMeal() {
    if (!this.name || !this.category) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: this.name,
      category: this.category
    };

    await this.mealService.add(newMeal);

    this.name = '';
    this.category = '';

    await this.loadMeals();
  }

  async deleteMeal(id: string) {
    await this.mealService.delete(id);
    await this.loadMeals();
  }
}