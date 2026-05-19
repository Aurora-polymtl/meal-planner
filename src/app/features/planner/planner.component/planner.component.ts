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
  // ===== UI =====
  showGenerator = false;

  // ===== NAVIGATION =====
  currentWeekStart = this.getMonday(new Date());

  // ===== GENERATION =====
  startDate = '';
  numberOfDays = 7;

  // ===== DATA =====
  plans: MealPlan[] = [];

  constructor(private plannerService: PlannerService) {}

  async ngOnInit() {
    this.plans = await this.plannerService.getPlans();
  }

  // =====================
  // NAVIGATION SEMAINE
  // =====================

  previousWeek() {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d;
  }

  nextWeek() {
    const d = new Date(this.currentWeekStart);
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d;
  }

  // =====================
  // GENERATOR
  // =====================

  openGenerator() {
    this.showGenerator = true;
  }

  closeGenerator() {
    this.showGenerator = false;
  }

  generatePlan() {
    const start = new Date(this.startDate);

    const days = Array.from({ length: this.numberOfDays }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        date: d.toISOString().split('T')[0],
        meals: [],
      };
    });

    const plan: MealPlan = {
      id: crypto.randomUUID(),
      startDate: this.startDate,
      days,
    };

    this.plannerService.addPlan(plan);

    this.plans.push(plan);

    this.currentWeekStart = new Date(start);
    this.showGenerator = false;
  }

  // =====================
  // CALENDAR LOGIC
  // =====================

  getWeekDays(date: Date): Date[] {
    const start = this.getMonday(date);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  getMealsForDay(date: Date): string[] {
    const iso = date.toISOString().split('T')[0];

    for (const plan of this.plans) {
      const day = plan.days.find((d) => d.date === iso);
      if (day) return day.meals;
    }

    return [];
  }

  getMonday(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const day = d.getDay(); // 0 = dimanche, 1 = lundi
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);

    return new Date(d.setDate(diff));
  }
}
