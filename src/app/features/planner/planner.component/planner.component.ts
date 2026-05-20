import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PlannerService } from '../planner.service';
import { MealService } from '../../meals/meal.service';
import { MealPlan } from '../../../models/meal-plan.model';
import { Meal } from '../../../models/meal';
import { MealDetailComponent } from '../../meals/meal-detail.component/meal-detail.component';

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
  errorMessage = '';

  selectedMeal: Meal | null = null;

  constructor(
    private plannerService: PlannerService,
    private mealService: MealService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadData();
    this.cdr.detectChanges();
  }

  async loadData() {
    await Promise.all([this.loadPlans(), this.loadMeals()]);
  }

  async loadPlans() {
    this.plans = await this.plannerService.getPlans();
  }

  async loadMeals() {
    this.meals = await this.mealService.getAll();
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
    this.startDate ||= this.toIsoDate(new Date());
    this.showGenerator = true;
    this.cdr.detectChanges();
  }

  closeGenerator() {
    this.errorMessage = '';
    this.previewPlan = null;
    this.showGenerator = false;
    this.cdr.detectChanges();
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

  getDinnerMealIdForDay(date: Date): string | null {
    return this.getMealIdForDay(date, 'dinnerMealId');
  }

  getSupperMealIdForDay(date: Date): string | null {
    return this.getMealIdForDay(date, 'supperMealId');
  }

  async generatePlan() {
    this.errorMessage = '';

    try {
      await this.loadMeals();

      this.previewPlan = await this.plannerService.generatePlanPreview({
        startDate: this.startDate,
        numberOfDays: this.numberOfDays,
        generateDinner: this.generateDinner,
        generateSupper: this.generateSupper,
      });

      this.cdr.detectChanges();
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue pendant la génération du menu.';

      this.cdr.detectChanges();
    }
  }

  async confirmPreviewPlan() {
    if (!this.previewPlan) return;

    await this.plannerService.confirmPlan(this.previewPlan);
    await this.loadPlans();

    this.currentWeekStart = this.getMonday(new Date(this.previewPlan.startDate));
    this.previewPlan = null;
    this.showGenerator = false;

    this.cdr.detectChanges();
  }

  getWeekDays(date: Date): Date[] {
    const start = this.getMonday(date);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  getDinnerForDay(date: Date): string | null {
    const mealId = this.getMealIdForDay(date, 'dinnerMealId');
    return this.getMealNameById(mealId);
  }

  getSupperForDay(date: Date): string | null {
    const mealId = this.getMealIdForDay(date, 'supperMealId');
    return this.getMealNameById(mealId);
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
    return date.toISOString().split('T')[0];
  }
}
