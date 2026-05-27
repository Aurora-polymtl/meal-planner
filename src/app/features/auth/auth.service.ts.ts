import { Injectable } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firebaseAuth } from '../../firebase/firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  getCurrentUser(): Promise<User> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        unsubscribe();

        if (!user) {
          reject(new Error('Utilisateur non connecté.'));
          return;
        }

        resolve(user);
      });
    });
  }

  isLoggedIn(): Promise<boolean> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(firebaseAuth, email, password);
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(firebaseAuth, email, password);
  }

  logout() {
    return signOut(firebaseAuth);
  }
}