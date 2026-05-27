import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PlannerService } from '../planner.service';
import { MealService } from '../../meals/meal.service';
import { MealPlan } from '../../../models/meal-plan.model';
import { Meal } from '../../../models/meal';
import { MealDetailComponent } from '../../meals/meal-detail.component/meal-detail.component';
import { CategoryService } from '../../meals/category.service';
import { Category } from '../../../models/category';
import { SlotCategoryConstraint } from '../menu-generator.service';
import { PlannerSettingsService } from '../planner-settings.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [FormsModule, DatePipe, MealDetailComponent],
})
export class PlannerComponent {
  showGenerator = false;

  currentWeekStart = this.getMonday(new Date());

  startDate = '';
  numberOfDays = 7;

  generateDinner = true;
  generateSupper = true;

  plans: MealPlan[] = [];
  meals: Meal[] = [];

  previewPlan: MealPlan | null = null;
  selectedMeal: Meal | null = null;

  errorMessage = '';
  showConflictConfirmation = false;

  isGenerating = false;
  isConfirming = false;

  repeatRestriction: 'none' | 'week' | 'twoWeeks' = 'none';

  categories: Category[] = [];
  slotCategoryConstraints: Record<string, string> = {};

  showConstraintCalendar = false;
  settingsSavedMessage = false;

  constructor(
    private plannerService: PlannerService,
    private mealService: MealService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private plannerSettingsService: PlannerSettingsService,
  ) {}

  async ngOnInit() {
    await this.loadData();
    this.cdr.detectChanges();
  }

  async loadData() {
    await Promise.all([this.loadPlans(), this.loadMeals(), this.loadCategories()]);
  }

  async loadPlans() {
    this.plans = await this.plannerService.getPlans();
  }

  async loadMeals() {
    this.meals = await this.mealService.getAll();
  }

  async loadCategories() {
    this.categories = await this.categoryService.getAll();
  }

  previousWeek() {
    const date = new Date(this.currentWeekStart);
    date.setDate(date.getDate() - 7);
    this.currentWeekStart = date;
  }

  nextWeek() {
    const date = new Date(this.currentWeekStart);
    date.setDate(date.getDate() + 7);
    this.currentWeekStart = date;
  }

  openGenerator() {
    this.errorMessage = '';
    this.previewPlan = null;
    this.showConflictConfirmation = false;
    this.startDate ||= this.toIsoDate(new Date());
    this.loadSavedGeneratorSettings();
    this.showGenerator = true;
    this.showConstraintCalendar = false;
    this.cdr.detectChanges();
  }

  closeGenerator() {
    if (this.isGenerating || this.isConfirming) return;

    this.errorMessage = '';
    this.previewPlan = null;
    this.showConflictConfirmation = false;
    this.showGenerator = false;
    this.showConstraintCalendar = false;
    this.cdr.detectChanges();
  }

  toggleConstraintCalendar() {
    this.showConstraintCalendar = !this.showConstraintCalendar;
  }

  async generatePlan() {
    if (this.isGenerating || this.isConfirming) return;

    this.errorMessage = '';
    this.showConflictConfirmation = false;
    this.isGenerating = true;
    this.cdr.detectChanges();

    try {
      await this.loadMeals();

      this.previewPlan = await this.plannerService.generatePlanPreview({
        startDate: this.startDate,
        numberOfDays: this.numberOfDays,
        generateDinner: this.generateDinner,
        generateSupper: this.generateSupper,
        repeatRestriction: this.repeatRestriction,
        categoryConstraints: this.getCategoryConstraints(),
      });
    } catch (error) {
      this.previewPlan = null;
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue pendant la génération du menu.';
    } finally {
      this.isGenerating = false;
      this.cdr.detectChanges();
    }
  }

  async confirmPreviewPlan() {
    if (!this.previewPlan || this.isGenerating || this.isConfirming) return;

    const planToConfirm = structuredClone(this.previewPlan);

    this.errorMessage = '';
    this.isConfirming = true;
    this.cdr.detectChanges();

    try {
      await this.plannerService.confirmPlan(planToConfirm);
      await this.applyConfirmedPlan(planToConfirm);
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFLICT') {
        this.showConflictConfirmation = true;
        return;
      }

      this.errorMessage = 'Une erreur est survenue pendant la confirmation du menu.';
    } finally {
      this.isConfirming = false;
      this.cdr.detectChanges();
    }
  }

  async confirmPreviewPlanWithOverwrite() {
    if (!this.previewPlan || this.isGenerating || this.isConfirming) return;

    const planToConfirm = structuredClone(this.previewPlan);

    this.errorMessage = '';
    this.isConfirming = true;
    this.cdr.detectChanges();

    try {
      await this.plannerService.confirmPlan(planToConfirm, true);
      await this.applyConfirmedPlan(planToConfirm);
    } catch {
      this.errorMessage = 'Une erreur est survenue pendant le remplacement du menu.';
    } finally {
      this.isConfirming = false;
      this.cdr.detectChanges();
    }
  }

  private async applyConfirmedPlan(confirmedPlan: MealPlan) {
    await this.loadPlans();

    this.currentWeekStart = this.getMonday(new Date(confirmedPlan.startDate));
    this.previewPlan = null;
    this.showConflictConfirmation = false;
    this.showGenerator = false;
  }

  openMealDetails(mealId: string | null) {
    if (!mealId) return;

    const meal = this.meals.find((m) => m.id === mealId);
    if (!meal) return;

    this.selectedMeal = structuredClone(meal);
  }

  closeMealDetails() {
    this.selectedMeal = null;
  }

  getWeekDays(date: Date): Date[] {
    const start = this.getMonday(date);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  getDinnerMealIdForDay(date: Date): string | null {
    return this.getMealIdForDay(date, 'dinnerMealId');
  }

  getSupperMealIdForDay(date: Date): string | null {
    return this.getMealIdForDay(date, 'supperMealId');
  }

  getDinnerForDay(date: Date): string | null {
    return this.getMealNameById(this.getDinnerMealIdForDay(date));
  }

  getSupperForDay(date: Date): string | null {
    return this.getMealNameById(this.getSupperMealIdForDay(date));
  }

  getMealNameById(mealId: string | null): string | null {
    if (!mealId) return null;

    return this.meals.find((meal) => meal.id === mealId)?.name ?? 'Repas introuvable';
  }

  private getMealIdForDay(date: Date, type: 'dinnerMealId' | 'supperMealId'): string | null {
    const iso = this.toIsoDate(date);

    for (const plan of [...this.plans].reverse()) {
      const day = plan.days.find((d) => d.date === iso);
      const mealId = day?.[type];

      if (mealId) return mealId;
    }

    return null;
  }

  getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);

    return new Date(d.setDate(diff));
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getGeneratorDays(): Date[] {
    if (!this.startDate) return [];

    const start = this.parseIsoDate(this.startDate);
    const numberOfDays = Math.max(1, Math.min(this.numberOfDays, 31));

    return Array.from({ length: numberOfDays }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  getSlotCategoryConstraint(date: Date, slot: 'dinner' | 'supper'): string {
    return this.slotCategoryConstraints[this.getSlotKey(date, slot)] ?? '';
  }

  setSlotCategoryConstraint(date: Date, slot: 'dinner' | 'supper', category: string) {
    const key = this.getSlotKey(date, slot);

    if (!category) {
      delete this.slotCategoryConstraints[key];
      return;
    }

    this.slotCategoryConstraints[key] = category;
  }

  getCategoryConstraints(): SlotCategoryConstraint[] {
    return Object.entries(this.slotCategoryConstraints).map(([key, category]) => {
      const [date, slot] = key.split('|') as [string, 'dinner' | 'supper'];

      return {
        date,
        slot,
        category,
      };
    });
  }

  private getSlotKey(date: Date, slot: 'dinner' | 'supper'): string {
    return `${this.toIsoDate(date)}|${slot}`;
  }

  private parseIsoDate(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  async saveGeneratorSettings() {
    await this.plannerSettingsService.save({
      numberOfDays: this.numberOfDays,
      generateDinner: this.generateDinner,
      generateSupper: this.generateSupper,
      repeatRestriction: this.repeatRestriction,
      slotCategoryConstraints: this.getSavedSlotCategoryConstraints(),
    });

    this.settingsSavedMessage = true;

    setTimeout(() => {
      this.settingsSavedMessage = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  async loadSavedGeneratorSettings() {
    const settings = await this.plannerSettingsService.load();

    if (!settings) return;

    this.numberOfDays = settings.numberOfDays;
    this.generateDinner = settings.generateDinner;
    this.generateSupper = settings.generateSupper;
    this.repeatRestriction = settings.repeatRestriction;

    this.slotCategoryConstraints = {};

    for (const constraint of settings.slotCategoryConstraints) {
      const day = this.getGeneratorDays()[constraint.dayIndex];

      if (!day) continue;

      this.setSlotCategoryConstraint(day, constraint.slot, constraint.category);
    }
  }

  private getSavedSlotCategoryConstraints() {
    return Object.entries(this.slotCategoryConstraints)
      .map(([key, category]) => {
        const [date, slot] = key.split('|') as [string, 'dinner' | 'supper'];
        const dayIndex = this.getGeneratorDays().findIndex((day) => this.toIsoDate(day) === date);

        return {
          dayIndex,
          slot,
          category,
        };
      })
      .filter((constraint) => constraint.dayIndex >= 0);
  }

  getMealsForSlot(slot: 'dinner' | 'supper'): Meal[] {
    return this.meals.filter((meal) => {
      const usage = meal.mealUsage ?? 'both';
      return usage === 'both' || usage === slot;
    });
  }

  updatePreviewMeal(dayDate: string, slot: 'dinner' | 'supper', mealId: string) {
    if (!this.previewPlan) return;

    this.previewPlan = {
      ...this.previewPlan,
      days: this.previewPlan.days.map((day) => {
        if (day.date !== dayDate) return day;

        return {
          ...day,
          dinnerMealId: slot === 'dinner' ? mealId : day.dinnerMealId,
          supperMealId: slot === 'supper' ? mealId : day.supperMealId,
        };
      }),
    };

    this.showConflictConfirmation = false;
    this.cdr.detectChanges();
  }
}
