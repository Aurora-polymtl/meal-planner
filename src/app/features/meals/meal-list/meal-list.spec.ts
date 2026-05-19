import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MealList } from './meal-list';

describe('MealList', () => {
  let component: MealList;
  let fixture: ComponentFixture<MealList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealList],
    }).compileComponents();

    fixture = TestBed.createComponent(MealList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
