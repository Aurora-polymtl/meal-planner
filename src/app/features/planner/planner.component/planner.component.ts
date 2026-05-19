import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-planner',
  standalone: true,
  templateUrl: './planner.component.html',
  styleUrl: './planner.component.scss',
  imports: [FormsModule]
})
export class PlannerComponent {

  startDay: string = 'Lundi';
  numberOfDays: number = 7;

  daysOfWeek = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
  ];

  get visibleDays() {
    const startIndex = this.daysOfWeek.indexOf(this.startDay);
    const result = [];

    for (let i = 0; i < this.numberOfDays; i++) {
      result.push(this.daysOfWeek[(startIndex + i) % 7]);
    }

    return result;
  }
}