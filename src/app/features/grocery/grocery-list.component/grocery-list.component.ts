import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GroceryIngredient, GroceryList } from '../../../models/grocery-list.model';
import { GroceryListService } from '../grocery-list.service';
import { QuantityFormatService } from '../../../core/utils/quantity-format.service';
import { MealUtils } from '../../meals/meal-utils';
import { generateId } from '../../../core/utils/id.utils';

@Component({
  selector: 'app-grocery-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './grocery-list.component.html',
  styleUrl: './grocery-list.component.scss',
})
export class GroceryListComponent implements OnInit {
  lists: GroceryList[] = [];
  selectedIndex = 0;

  viewMode: 'byMeal' | 'combined' = 'byMeal';
  isEditing = false;

  editableList: GroceryList | null = null;
  errorMessage = '';

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
    private groceryListService: GroceryListService,
    private cdr: ChangeDetectorRef,
    private quantityFormat: QuantityFormatService,
  ) {}

  async ngOnInit() {
    await this.loadLists();
  }

  async loadLists() {
    this.lists = await this.groceryListService.getAll();

    if (this.selectedIndex >= this.lists.length) {
      this.selectedIndex = Math.max(0, this.lists.length - 1);
    }

    this.cdr.detectChanges();
  }

  get selectedList(): GroceryList | null {
    return this.lists[this.selectedIndex] ?? null;
  }

  formatQuantity(value: number): string {
    return this.quantityFormat.format(value);
  }

  usesFractionalQuantity(unit: string): boolean {
    return this.fractionalUnits.includes(unit);
  }

  updateIngredientQuantity(ingredient: GroceryIngredient, value: string | number) {
    ingredient.quantity = MealUtils.parseQuantity(String(value));
  }

  updateIngredientUnit(ingredient: GroceryIngredient, unit: string) {
    ingredient.unit = unit;
  }

  getQuantityValue(ingredient: GroceryIngredient): string {
    return this.formatQuantity(ingredient.quantity);
  }

  getCombinedIngredients(): GroceryIngredient[] {
    if (!this.selectedList) return [];

    return this.groceryListService.getCombinedIngredients(this.selectedList);
  }

  previousList() {
    if (this.selectedIndex < this.lists.length - 1) {
      this.selectedIndex++;
    }
  }

  nextList() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
  }

  startEditing() {
    if (!this.selectedList) return;

    this.editableList = structuredClone(this.selectedList);
    this.isEditing = true;
    this.errorMessage = '';
  }

  cancelEditing() {
    this.editableList = null;
    this.isEditing = false;
    this.errorMessage = '';
  }

  async saveEditing() {
    if (!this.editableList) return;

    try {
      this.cleanEditableList();
      await this.groceryListService.save(this.editableList);
      this.isEditing = false;
      this.editableList = null;
      await this.loadLists();
    } catch {
      this.errorMessage = 'Une erreur est survenue pendant la sauvegarde.';
    }
  }

  addIngredient(sectionId: string) {
    if (!this.editableList) return;

    const section = this.editableList.sections.find((s) => s.id === sectionId);
    if (!section) return;

    section.ingredients.push({
      id: generateId(),
      name: '',
      quantity: 0,
      unit: 'unité',
    });
  }

  deleteIngredient(sectionId: string, ingredientId: string) {
    if (!this.editableList) return;

    const section = this.editableList.sections.find((s) => s.id === sectionId);
    if (!section) return;

    section.ingredients = section.ingredients.filter(
      (ingredient) => ingredient.id !== ingredientId,
    );
  }

  getSlotLabel(slot: 'dinner' | 'supper'): string {
    return slot === 'dinner' ? 'Dîner' : 'Souper';
  }

  private cleanEditableList() {
    if (!this.editableList) return;

    this.editableList.sections = this.editableList.sections.map((section) => ({
      ...section,
      ingredients: section.ingredients
        .map((ingredient) => ({
          ...ingredient,
          name: ingredient.name.trim(),
          unit: ingredient.unit.trim(),
          quantity: Number(ingredient.quantity) || 0,
        }))
        .filter((ingredient) => ingredient.name),
    }));

    this.editableList.commonItems = (this.editableList.commonItems ?? [])
      .map((ingredient) => ({
        ...ingredient,
        name: ingredient.name.trim(),
        unit: ingredient.unit.trim(),
        quantity: Number(ingredient.quantity) || 0,
      }))
      .filter((ingredient) => ingredient.name);
  }

  addCommonItem() {
    if (!this.editableList) return;

    this.editableList.commonItems = [
      ...(this.editableList.commonItems ?? []),
      {
        id: generateId(),
        name: '',
        quantity: 0,
        unit: 'unité',
      },
    ];
  }

  deleteCommonItem(ingredientId: string) {
    if (!this.editableList) return;

    this.editableList.commonItems = (this.editableList.commonItems ?? []).filter(
      (ingredient) => ingredient.id !== ingredientId,
    );
  }
}
