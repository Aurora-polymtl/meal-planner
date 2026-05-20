import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealDetailComponent } from './meal-detail.component';

describe('MealDetailComponent', () => {
  let component: MealDetailComponent;
  let fixture: ComponentFixture<MealDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MealDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
