import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MealListComponent } from './features/meals/meal-list/meal-list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MealListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

}
