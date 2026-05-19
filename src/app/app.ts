import { Component } from '@angular/core';
import { MealListComponent } from './features/meals/meal-list/meal-list';
import { PlannerComponent } from './features/planner/planner.component/planner.component';

@Component({
  selector: 'app-root',
  imports: [MealListComponent, PlannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  tab: 'meals' | 'planner' = 'meals';
}
