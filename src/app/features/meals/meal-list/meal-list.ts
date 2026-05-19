import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MealService } from '../meal.service';
import { Meal } from '../../../models/meal';
import { FormsModule } from '@angular/forms';
import { MealValidationService, MealErrors } from '../meal-validation.service';

@Component({
  selector: 'app-meal-list',
  standalone: true,
  templateUrl: './meal-list.html',
  styleUrl: './meal-list.scss',
  imports: [FormsModule]
})
export class MealListComponent implements OnInit {

  meals: Meal[] = [];

  name: string = '';
  category: string = '';

  showForm: boolean = false;

  errors: MealErrors = {};

  constructor(
    private mealService: MealService,
    private validationService: MealValidationService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadMeals();
  }

  openForm() {
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  async loadMeals() {
    this.meals = await this.mealService.getAll();
    this.cdr.detectChanges();
  }

  async addMeal() {
    this.errors = this.validationService.validateMeal(
      this.name,
      this.category,
      this.meals
    );

    if (this.errors.name || this.errors.category) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: this.name.trim(),
      category: this.category.trim()
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