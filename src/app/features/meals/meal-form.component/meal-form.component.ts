import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MealService } from '../meal.service';
import { MealValidationService, MealErrors } from '../meal-validation.service';
import { Ingredient, Meal } from '../../../models/meal';
import { MealUtils } from '../meal-utils';
import { Input } from '@angular/core';
import { Category } from '../../../models/category';
import { generateId } from '../../../core/utils/id.utils';

@Component({
  selector: 'app-meal-form',
  standalone: true,
  templateUrl: './meal-form.component.html',
  styleUrl: './meal-form.component.scss',
  imports: [FormsModule],
})
export class MealFormComponent {
  @Input() availableCategories: Category[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  name = '';

  categoryInput = '';
  categories: string[] = [];

  mealUsage: 'dinner' | 'supper' | 'both' = 'both';

  showIngredients = false;

  ingredientName = '';
  ingredientQuantity = '';
  ingredientUnit = 'unité';

  ingredients: Ingredient[] = [];

  errors: MealErrors = {};

  units = [
    'g',
    'kg',
    'mL',
    'L',
    'tasse',
    'cuillère à thé',
    'cuillère à soupe',
    'oz',
    'lb',
    'unité',
  ];

  fractionalUnits = ['tasse', 'cuillère à thé', 'cuillère à soupe'];

  fractionalQuantities = [
    '1/8',
    '1/4',
    '1/3',
    '1/2',
    '2/3',
    '3/4',
    '1',
    '1 1/2',
    '2',
    '3',
    '4',
    '5',
  ];

  constructor(
    private mealService: MealService,
    private validationService: MealValidationService,
  ) {}

  closeForm() {
    this.close.emit();
  }

  toggleIngredients() {
    this.showIngredients = !this.showIngredients;
  }

  usesFractionalQuantity() {
    return this.fractionalUnits.includes(this.ingredientUnit);
  }

  addCategory() {
    const error = this.validationService.validateCategory(this.categoryInput);

    if (error) {
      this.errors.category = error;
      return;
    }

    const clean = this.categoryInput.trim();

    if (!this.categories.includes(clean)) {
      this.categories.push(clean);
    }

    this.categoryInput = '';
    this.errors.category = undefined;
  }

  removeCategory(cat: string) {
    this.categories = this.categories.filter((c) => c !== cat);
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

    this.ingredients.push({
      name: this.ingredientName.trim(),
      quantity: MealUtils.parseQuantity(this.ingredientQuantity),
      unit: this.ingredientUnit,
    });

    this.ingredientName = '';
    this.ingredientQuantity = '';
    this.ingredientUnit = 'unité';
    this.errors.ingredient = undefined;
  }

  removeIngredient(index: number) {
    this.ingredients.splice(index, 1);
  }

  async addMeal() {
    this.errors = this.validationService.validateMeal(
      this.name,
      this.categories,
      [],
    );

    if (this.errors.name || this.errors.category) return;

    const meal: Meal = {
      id: generateId(),
      name: this.name.trim(),
      categories: this.categories,
      ingredients: this.ingredients,
      mealUsage: this.mealUsage,
    };

    await this.mealService.add(meal);

    this.saved.emit();
  }
}