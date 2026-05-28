import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meal } from '../../../models/meal';
import { MealService } from '../meal.service';
import { QuantityFormatService } from '../../../core/utils/quantity-format.service';
import { MealUtils } from '../meal-utils';
import { Category } from '../../../models/category';
import {
  INGREDIENT_UNITS,
  FRACTIONAL_QUANTITIES,
  FRACTIONAL_UNITS,
} from '../../../core/constants/ingredient.constants';
import { GroceryListService } from '../../grocery/grocery-list.service';

@Component({
  selector: 'app-meal-detail',
  standalone: true,
  templateUrl: './meal-detail.component.html',
  styleUrl: './meal-detail.component.scss',
  imports: [FormsModule],
})
export class MealDetailComponent {
  @Input() meal!: Meal;
  @Input() availableCategories: Category[] = [];
  @Input() readonly = false;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  editMode = false;

  editCategoryInput = '';
  editIngredientName = '';
  editIngredientQuantity = '';
  editIngredientUnit = 'unité';

  mealUsage: 'dinner' | 'supper' | 'both' = 'both';

  units = INGREDIENT_UNITS;
  fractionalUnits = FRACTIONAL_UNITS;
  fractionalQuantities = FRACTIONAL_QUANTITIES;

  constructor(
    private mealService: MealService,
    private groceryListService: GroceryListService,
    private quantityFormat: QuantityFormatService,
  ) {}

  formatQuantity(v: number) {
    return this.quantityFormat.format(v);
  }

  usesFractionalQuantity() {
    return this.fractionalUnits.includes(this.editIngredientUnit);
  }

  toggleEdit() {
    if (this.readonly) return;
    this.editMode = !this.editMode;
  }

  async save() {
    const cleanName = this.meal.name.trim();

    if (!cleanName) {
      return;
    }

    this.meal.name = cleanName;

    await this.mealService.update(this.meal);
    await this.groceryListService.updateMealSectionsFromMeal(this.meal);

    this.updated.emit();
    this.editMode = false;
  }

  addCategory() {
    const value = this.editCategoryInput.trim();
    if (!value) return;

    if (!this.meal.categories.includes(value)) {
      this.meal.categories.push(value);
    }

    this.editCategoryInput = '';
  }

  removeCategory(cat: string) {
    this.meal.categories = this.meal.categories.filter((c) => c !== cat);
  }

  addIngredient() {
    const name = this.editIngredientName.trim();

    if (!name || !this.editIngredientQuantity || !this.editIngredientUnit) {
      return;
    }

    this.meal.ingredients = [
      ...(this.meal.ingredients ?? []),
      {
        name,
        quantity: MealUtils.parseQuantity(this.editIngredientQuantity),
        unit: this.editIngredientUnit,
      },
    ];

    this.editIngredientName = '';
    this.editIngredientQuantity = '';
    this.editIngredientUnit = 'unité';
  }

  removeIngredient(index: number) {
    this.meal.ingredients = (this.meal.ingredients ?? []).filter((_, i) => i !== index);
  }
}
