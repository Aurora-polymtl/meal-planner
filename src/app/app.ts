import { Component } from '@angular/core';
import { MealListComponent } from './features/meals/meal-list.component/meal-list.component';
import { PlannerComponent } from './features/planner/planner.component/planner.component';
import { CategoryManagerComponent } from './features/meals/category-manager.component/category-manager.component';

@Component({
  selector: 'app-root',
  imports: [MealListComponent, PlannerComponent, CategoryManagerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  tab: 'meals' | 'planner' | 'categories' = 'planner';
}