import { TestBed } from '@angular/core/testing';

import { PlannerSettingsService } from './planner-settings.service';

describe('PlannerSettingsService', () => {
  let service: PlannerSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlannerSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
