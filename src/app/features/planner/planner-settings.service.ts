import { Injectable } from '@angular/core';
import { RepeatRestriction } from './menu-generator.service';

export interface SavedSlotCategoryConstraint {
  dayIndex: number;
  slot: 'dinner' | 'supper';
  category: string;
}

export interface PlannerGeneratorSettings {
  numberOfDays: number;
  generateDinner: boolean;
  generateSupper: boolean;
  repeatRestriction: RepeatRestriction;
  slotCategoryConstraints: SavedSlotCategoryConstraint[];
}

const STORAGE_KEY = 'planner-generator-settings';

@Injectable({ providedIn: 'root' })
export class PlannerSettingsService {
  save(settings: PlannerGeneratorSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  load(): PlannerGeneratorSettings | null {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    try {
      return JSON.parse(raw) as PlannerGeneratorSettings;
    } catch {
      return null;
    }
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}