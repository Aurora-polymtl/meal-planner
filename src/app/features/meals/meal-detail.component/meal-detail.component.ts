import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meal } from '../../../models/meal';
import { MealService } from '../meal.service';
import { QuantityFormatService } from '../../../core/utils/quantity-format.service';
import { MealUtils } from '../meal-utils';
import { Category } from '../../../models/category';

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
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  editMode = false;

  editCategoryInput = '';
  editIngredientName = '';
  editIngredientQuantity = '';
  editIngredientUnit = 'unité';

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
    private quantityFormat: QuantityFormatService,
  ) {}

  formatQuantity(v: number) {
    return this.quantityFormat.format(v);
  }

  usesFractionalQuantity() {
    return this.fractionalUnits.includes(this.editIngredientUnit);
  }

  toggleEdit() {
    this.editMode = !this.editMode;
  }

  async save() {
    await this.mealService.update(this.meal);
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