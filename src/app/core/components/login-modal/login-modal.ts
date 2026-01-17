import { Component, inject, model, output, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.scss',
})
export class LoginModal {
  private readonly authService = inject(AuthService);
  readonly close = output<void>();
  readonly email = signal('');
  readonly password = signal('');
  readonly errorMsg = signal('');

  readonly mode = signal<'link' | 'login'>('link');

  readonly isAnonymous = this.authService.isAnonymous;

  constructor() {
    // May happen
    if (!this.isAnonymous()) {
      this.mode.set('login');
    }
  }

  toggleMode(newMode: 'link' | 'login') {
    this.mode.set(newMode);
    this.errorMsg.set('');
  }

  async handleSubmit() {
    this.errorMsg.set('');
    try {
      if (this.mode() === 'link') {
        await this.authService.upgradeToPermanent(this.email(), this.password());
      } else {
        await this.authService.login(this.email(), this.password());
      }
      this.close.emit();
    } catch (err: any) {
      this.handleError(err);
    }
  }

  private handleError(err: any) {
    if (err.code === 'auth/email-already-in-use') {
      this.errorMsg.set('That email is already taken. Try logging in?');
    } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      this.errorMsg.set('Invalid email or password.');
    } else if (err.code === 'auth/weak-password') {
      this.errorMsg.set('Password is too weak (min 6 chars).');
    } else if (err.code === 'auth/credential-already-in-use') {
      this.errorMsg.set('This email is already linked to another account.');
    } else {
      this.errorMsg.set(err.message || 'An error occurred.');
    }
  }

  async loginWithGoogle() {
    this.errorMsg.set('');
    try {
      await this.authService.loginWithGoogle();
      this.close.emit(); 
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        this.errorMsg.set('Google login failed. Please try again.');
      }
    }
  }
}
