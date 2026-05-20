import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MealService } from '../meal.service';
import { Meal, Ingredient } from '../../../models/meal';
import { FormsModule } from '@angular/forms';

import { MealValidationService, MealErrors } from '../meal-validation.service';
import { QuantityFormatService } from '../../../core/utils/quantity-format.service';

@Component({
  selector: 'app-meal-list',
  standalone: true,
  templateUrl: './meal-list.component.html',
  styleUrl: './meal-list.component.scss',
  imports: [FormsModule],
})
export class MealListComponent implements OnInit {
  meals: Meal[] = [];

  name: string = '';

  categoryInput: string = '';
  categories: string[] = [];

  showIngredients = false;

  ingredientName = '';
  ingredientQuantity = '';
  ingredientUnit = '';

  ingredients: Ingredient[] = [];

  showForm = false;

  errors: MealErrors = {};

  // =====================
  // DÉTAIL
  // =====================
  selectedMeal: Meal | null = null;
  editMode = false;

  editCategoryInput = '';
  editIngredientName = '';
  editIngredientQuantity = '';
  editIngredientUnit = '';

  units = [
    'g','kg','mL','L','tasse','cuillère à thé',
    'cuillère à soupe','oz','lb','unité',
  ];

  fractionalUnits = ['tasse', 'cuillère à thé', 'cuillère à soupe'];

  fractionalQuantities = [
    '1/8','1/4','1/3','1/2','2/3','3/4',
    '1','1 1/4','1 1/3','1 1/2','1 2/3','1 3/4',
    '2','2 1/4','2 1/3','2 1/2','2 2/3','2 3/4',
    '3','3 1/4','3 1/3','3 1/2','3 2/3','3 3/4',
    '4','4 1/4','4 1/3','4 1/2','4 2/3','4 3/4',
    '5',
  ];

  constructor(
    private mealService: MealService,
    private validationService: MealValidationService,
    private quantityFormat: QuantityFormatService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadMeals();
  }

  // =====================
  // DATA
  // =====================
  async loadMeals() {
    this.meals = await this.mealService.getAll();
    this.cdr.detectChanges();
  }

  // =====================
  // FORMAT
  // =====================
  formatQuantity(value: number): string {
    return this.quantityFormat.format(value);
  }

  // =====================
  // FORM
  // =====================
  openForm() {
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  // =====================
  // CATÉGORIES (FORM)
  // =====================
  addCategory() {
    const error = this.validationService.validateCategory(this.categoryInput);

    if (error) {
      this.errors.category = error;
      return;
    }

    const clean = this.categoryInput.trim();

    if (this.categories.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      this.errors.category = 'Cette catégorie existe déjà.';
      return;
    }

    this.categories.push(clean);
    this.categoryInput = '';
    this.errors.category = '';
  }

  removeCategory(category: string) {
    this.categories = this.categories.filter((c) => c !== category);
  }

  // =====================
  // INGREDIENTS (FORM)
  // =====================
  toggleIngredients() {
    this.showIngredients = !this.showIngredients;
  }

  addIngredient() {
    const error = this.validationService.validateIngredient(
      this.ingredientName,
      this.ingredientQuantity,
      this.ingredientUnit,
    );

    if (error) {
      this.errors.ingredient = error;
      return;
    }

    if (!this.ingredientName && !this.ingredientQuantity && !this.ingredientUnit) {
      return;
    }

    this.ingredients.push({
      name: this.ingredientName.trim(),
      quantity: this.parseQuantity(this.ingredientQuantity),
      unit: this.ingredientUnit,
    });

    this.ingredientName = '';
    this.ingredientQuantity = '';
    this.ingredientUnit = '';
    this.errors.ingredient = '';
  }

  removeIngredient(index: number) {
    this.ingredients.splice(index, 1);
  }

  usesFractionalQuantity(): boolean {
    return this.fractionalUnits.includes(this.ingredientUnit);
  }

  // =====================
  // PARSING
  // =====================
  parseQuantity(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    if (!value.includes('/')) return parseFloat(value);

    if (value.includes(' ')) {
      const parts = value.split(' ');
      const whole = parseFloat(parts[0]);
      const fraction = this.parseFraction(parts[1]);
      return whole + fraction;
    }

    return this.parseFraction(value);
  }

  parseFraction(fraction: string): number {
    const parts = fraction.split('/');
    return parseFloat(parts[0]) / parseFloat(parts[1]);
  }

  // =====================
  // SAVE
  // =====================
  async addMeal() {
    this.errors = this.validationService.validateMeal(
      this.name,
      this.categories,
      this.meals,
    );

    if (this.errors.name || this.errors.category) return;

    const newMeal: Meal = {
      id: crypto.randomUUID(),
      name: this.name.trim(),
      categories: this.categories,
      ingredients: this.ingredients,
    };

    await this.mealService.add(newMeal);

    this.name = '';
    this.categoryInput = '';
    this.categories = [];
    this.ingredients = [];

    this.ingredientName = '';
    this.ingredientQuantity = '';
    this.ingredientUnit = '';

    await this.loadMeals();
  }

  async deleteMeal(id: string) {
    await this.mealService.delete(id);
    await this.loadMeals();
  }

  // =====================
  // DETAIL
  // =====================
  openDetails(meal: Meal) {
    this.selectedMeal = structuredClone(meal);
    this.editMode = false;
  }

  closeDetails() {
    this.selectedMeal = null;
    this.editMode = false;
  }

  enableEdit() {
    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;

    this.editCategoryInput = '';
    this.editIngredientName = '';
    this.editIngredientQuantity = '';
    this.editIngredientUnit = '';
  }

  async saveMealChanges() {
    if (!this.selectedMeal) return;

    await this.mealService.update(this.selectedMeal);
    await this.loadMeals();

    this.editMode = false;
    this.cdr.detectChanges();
  }

  // =====================
  // EDIT CATÉGORIES
  // =====================
  addCategoryToSelected() {
    if (!this.selectedMeal) return;

    const value = this.editCategoryInput.trim();
    if (!value) return;

    if (this.selectedMeal.categories.includes(value)) return;

    this.selectedMeal.categories.push(value);
    this.editCategoryInput = '';
  }

  removeCategoryFromSelected(category: string) {
    if (!this.selectedMeal) return;

    this.selectedMeal.categories =
      this.selectedMeal.categories.filter((c) => c !== category);
  }

  // =====================
  // EDIT INGREDIENTS
  // =====================
  addIngredientToSelected() {
    if (!this.selectedMeal) return;

    const meal = this.selectedMeal;

    if (!this.editIngredientName || !this.editIngredientUnit) return;

    const newIngredient: Ingredient = {
      name: this.editIngredientName.trim(),
      quantity: this.parseQuantity(this.editIngredientQuantity),
      unit: this.editIngredientUnit,
    };

    meal.ingredients = [...(meal.ingredients ?? []), newIngredient];

    this.editIngredientName = '';
    this.editIngredientQuantity = '';
    this.editIngredientUnit = '';
  }

  removeIngredientFromSelected(index: number) {
    if (!this.selectedMeal) return;

    this.selectedMeal.ingredients =
      (this.selectedMeal.ingredients ?? []).filter((_, i) => i !== index);
  }
}