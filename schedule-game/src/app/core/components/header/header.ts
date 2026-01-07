import { Component, input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoginModal } from '../login-modal/login-modal';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, LoginModal],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  readonly currentLevel = input.required<number>();
  readonly totalScore = input.required<number>();
  readonly authService = inject(AuthService);

  readonly showLogin = signal(false);
  readonly isAnonymous = this.authService.isAnonymous;

  readonly willpowerCost = input.required<number>();
  readonly willpowerBudget = input.required<number>();

  readonly willpowerBreakdown = input<string[]>([]);

  readonly formattedBreakdown = computed(() => {
    const list = this.willpowerBreakdown();
    return list.length > 0 ? list.join('\n') : 'No penalties yet!';
  });

  readonly userName = input('Player');
  readonly userAvatar = input<string | undefined>(undefined);

  readonly willpowerState = computed((): 'safe' | 'caution' | 'danger' | 'critical' => {
    const cost = this.willpowerCost();
    const budget = this.willpowerBudget();

    if (cost > budget) return 'critical'; // > 100%
    if (cost >= budget * 0.8) return 'danger'; // 80-100%
    if (cost >= budget * 0.5) return 'caution'; // 50-79%
    return 'safe'; // 0-49%
  });

  readonly willpowerEmoji = computed((): string => {
    switch (this.willpowerState()) {
      case 'safe':
        return '🔋';
      case 'caution':
        return '⚡';
      case 'danger':
        return '😓';
      case 'critical':
        return '💥';
    }
  });

  readonly levelBadgeClass = computed((): string => {
    const level = this.currentLevel();
    if (level <= 2) return 'beginner';
    if (level <= 4) return 'intermediate';
    return 'advanced';
  });

  readonly formattedScore = computed((): string => {
    return this.totalScore().toLocaleString();
  });

  readonly userInitials = computed((): string => {
    return this.userName()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  toggleLoginModal() {
    this.showLogin.set(true);
  }

  doLogout() {
    if (confirm('Are you sure you want to log out?')) {
      this.authService.logout();
    }
  }
}
