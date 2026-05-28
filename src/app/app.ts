import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MealListComponent } from './features/meals/meal-list.component/meal-list.component';
import { PlannerComponent } from './features/planner/planner.component/planner.component';
import { CategoryManagerComponent } from './features/meals/category-manager.component/category-manager.component';
import { GroceryListComponent } from './features/grocery/grocery-list.component/grocery-list.component';

import { AuthService } from './features/auth/auth.service.ts';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MealListComponent,
    PlannerComponent,
    CategoryManagerComponent,
    GroceryListComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  tab: 'meals' | 'planner' | 'categories' | 'grocery' = 'planner';

  isLoggingOut = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async logout() {
    if (this.isLoggingOut) return;

    this.isLoggingOut = true;

    try {
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } finally {
      this.isLoggingOut = false;
    }
  }
}