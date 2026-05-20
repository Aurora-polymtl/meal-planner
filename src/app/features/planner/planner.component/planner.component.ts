import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PlannerService } from '../planner.service';
import { MealPlan } from '../../../models/meal-plan.model';

@Component({
  selector: 'app-planner',
  standalone: true,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [FormsModule, DatePipe],
})
export class PlannerComponent {
  showGenerator = false;

  currentWeekStart = this.getMonday(new Date());

  startDate = '';
  numberOfDays = 7;

  generateDinner = true;
  generateSupper = true;

  plans: MealPlan[] = [];
  previewPlan: MealPlan | null = null;
  errorMessage = '';

  constructor(private plannerService: PlannerService) {}

  async ngOnInit() {
    await this.loadPlans();
  }

  async loadPlans() {
    this.plans = await this.plannerService.getPlans();
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
  }

  closeGenerator() {
    this.errorMessage = '';
    this.previewPlan = null;
    this.showGenerator = false;
  }

  async generatePlan() {
    this.errorMessage = '';

    try {
      this.previewPlan = await this.plannerService.generatePlanPreview({
        startDate: this.startDate,
        numberOfDays: this.numberOfDays,
        generateDinner: this.generateDinner,
        generateSupper: this.generateSupper,
      });
    } catch (error) {
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue pendant la génération du menu.';
    }
  }

  async confirmPreviewPlan() {
    if (!this.previewPlan) return;

    await this.plannerService.confirmPlan(this.previewPlan);
    await this.loadPlans();

    this.currentWeekStart = this.getMonday(new Date(this.previewPlan.startDate));
    this.previewPlan = null;
    this.showGenerator = false;
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
    return this.getMealForDay(date, 'dinner');
  }

  getSupperForDay(date: Date): string | null {
    return this.getMealForDay(date, 'supper');
  }

  private getMealForDay(date: Date, type: 'dinner' | 'supper'): string | null {
    const iso = this.toIsoDate(date);

    for (const plan of [...this.plans].reverse()) {
      const day = plan.days.find((d) => d.date === iso);
      const meal = day?.[type];

      if (meal) return meal;
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