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
  readonly stressLevel = input.required<number>(); // 0-100
  readonly totalScore = input.required<number>();

  readonly userName = input('Player');
  readonly userAvatar = input<string | undefined>(undefined); // Optional avatar URL

  readonly stressColorClass = computed((): string => {
    const stress = this.stressLevel();
    if (stress < 30) return 'low';
    if (stress < 60) return 'medium';
    if (stress < 80) return 'high';
    return 'extreme';
  });

  readonly stressEmoji = computed((): string => {
    const stress = this.stressLevel();
    if (stress < 30) return '😊';
    if (stress < 60) return '😐';
    if (stress < 80) return '😰';
    return '🔥';
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
