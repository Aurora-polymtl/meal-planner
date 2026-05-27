import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service.ts';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  isRegisterMode = false;
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async submit() {
    this.errorMessage = '';
    this.loading = true;

    try {
      if (this.isRegisterMode) {
        await this.authService.register(this.email, this.password);
      } else {
        await this.authService.login(this.email, this.password);
      }

      await this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.errorMessage = '';
    this.isRegisterMode = !this.isRegisterMode;
  }

  private getErrorMessage(error: unknown): string {
    const code = (error as { code?: string }).code;

    switch (code) {
      case 'auth/invalid-email':
        return 'Adresse courriel invalide.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Courriel ou mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse courriel est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      default:
        return 'Une erreur est survenue. Réessaie plus tard.';
    }
  }
}