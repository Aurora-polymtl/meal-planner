import { Injectable } from '@angular/core';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase.config';
import { AuthService } from '../auth/auth.service.ts';
import { RepeatRestriction } from './menu-generator.service';

export interface SavedSlotCategoryConstraint {
  dayIndex: number;
  slot: 'dinner' | 'supper';
  categories: string[];
}

export interface PlannerGeneratorSettings {
  numberOfDays: number;
  generateDinner: boolean;
  generateSupper: boolean;
  repeatRestriction: RepeatRestriction;
  slotCategoryConstraints: SavedSlotCategoryConstraint[];
  slotGenerationSelections?: SavedSlotGenerationSelection[];
}

export interface SavedSlotGenerationSelection {
  dayIndex: number;
  slot: 'dinner' | 'supper';
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlannerSettingsService {
  constructor(private authService: AuthService) {}

  async save(settings: PlannerGeneratorSettings): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const settingsRef = doc(firestore, `users/${user.uid}/settings/generator`);

    await setDoc(settingsRef, settings);
  }

  async load(): Promise<PlannerGeneratorSettings | null> {
    const user = await this.authService.getCurrentUser();
    const settingsRef = doc(firestore, `users/${user.uid}/settings/generator`);
    const snapshot = await getDoc(settingsRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as PlannerGeneratorSettings;
  }

  async clear(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    const settingsRef = doc(firestore, `users/${user.uid}/settings/generator`);

    await deleteDoc(settingsRef);
  }
}