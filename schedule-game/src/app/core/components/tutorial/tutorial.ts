import { Component, HostListener, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WILLPOWER_PRICES } from '../../services/schedule.service';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorial.html',
  styleUrl: './tutorial.scss',
})
export class TutorialComponent {
  readonly close = output();
  protected readonly WP = WILLPOWER_PRICES;

  protected currentStep = signal(0);

  private touchStartX = 0;
  private touchEndX = 0;
  private readonly minSwipeDistance = 50;

  protected readonly steps = [
    {
      title: 'Welcome!',
      content:
        'Your goal is to survive 6 semesters (Levels) by creating the perfect class schedule. You must balance <strong>Academic Requirements</strong> with your <strong>Mental Health (Willpower)</strong>.<br><br>Each course has a set time—no dragging allowed!',
    },
    {
      title: 'Rules & Constraints',
      content:
        'Each level has <strong>Mandatory</strong> rules you MUST satisfy to pass.<br>There are also <strong>Goal</strong> rules (optional) that give you huge score bonuses.<br><br>To delete a course, just <strong>double-click</strong> on it in the grid.',
    },
    {
      title: 'Willpower Budget',
      icon: '🔋',
      content:
        'Every difficult schedule choice costs <strong>Willpower</strong>. If your cost exceeds the semester budget, you cannot pass the level.<br>Manage your stress wisely!',
    },
    {
      title: 'The Cost of Stress',
      icon: '💸',
      content: '',
    },
    {
      title: 'How to Play',
      icon: '🖱️',
      content:
        '1. <strong>Click</strong> courses in the list to add them.<br>2. <strong>Watch</strong> the Grid for conflicts and rule progress.<br>3. <strong>Check</strong> the Header for your Willpower status.<br>4. Click <strong>"Go to next level"</strong> when ready.',
    },
  ];

  next() {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update((s) => s + 1);
    } else {
      this.close.emit();
    }
  }

  prev() {
    if (this.currentStep() > 0) {
      this.currentStep.update((s) => s - 1);
    }
  }

  skip() {
    this.close.emit();
  }

  @HostListener('window:keydown.escape')
  handleEscKey() {
    this.close.emit();
  }

  @HostListener('window:keydown.arrowright')
  handleRightKey() {
    this.next();
  }

  @HostListener('window:keydown.arrowleft')
  handleLeftKey() {
    this.prev();
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    if (this.touchStartX - this.touchEndX > this.minSwipeDistance) {
      this.next();
    }

    if (this.touchEndX - this.touchStartX > this.minSwipeDistance) {
      this.prev();
    }
  }
}
