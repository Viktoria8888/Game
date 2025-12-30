import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  readonly currentLevel = input.required<number>();
  readonly totalScore = input.required<number>();

  readonly willpowerCost = input.required<number>();
  readonly willpowerBudget = input.required<number>();

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
    if (level <= 6) return 'advanced';
    return 'master';
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
}
