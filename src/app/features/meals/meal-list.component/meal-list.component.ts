import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MealService } from '../meal.service';
import { Meal } from '../../../models/meal';

import { MealFormComponent } from '../meal-form.component/meal-form.component';
import { MealDetailComponent } from '../meal-detail.component/meal-detail.component';

@Component({
  selector: 'app-meal-list',
  standalone: true,
  templateUrl: './meal-list.component.html',
  styleUrl: './meal-list.component.scss',
  imports: [FormsModule, MealFormComponent, MealDetailComponent],
})
export class MealListComponent implements OnInit {
  meals: Meal[] = [];

  showForm = false;
  selectedMeal: Meal | null = null;

  constructor(
    private mealService: MealService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadMeals();
  }

  async loadMeals() {
    this.meals = await this.mealService.getAll();
    this.cdr.detectChanges();
  }

  openForm() {
    this.showForm = true;
    this.selectedMeal = null;
  }

  closeForm() {
    this.showForm = false;
  }

  openDetails(meal: Meal) {
    this.selectedMeal = structuredClone(meal);
  }

  closeDetails() {
    this.selectedMeal = null;
  }

  async deleteMeal(id: string) {
    await this.mealService.delete(id);

    if (this.selectedMeal?.id === id) {
      this.closeDetails();
    }

    await this.loadMeals();
  }

  async onMealSaved() {
    await this.loadMeals();
    this.closeForm();
  }

  async onMealUpdated() {
    await this.loadMeals();
    this.closeDetails();
  }
}