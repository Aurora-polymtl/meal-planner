import { Component } from '@angular/core';
import { MealListComponent } from './features/meals/meal-list/meal-list';

@Component({
  selector: 'app-root',
  imports: [MealListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

}
