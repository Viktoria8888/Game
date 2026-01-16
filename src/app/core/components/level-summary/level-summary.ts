import { Component, computed, HostListener, input, output } from '@angular/core';
import { SemesterOutcome } from '../../services/game.service';
import { ComplexGameMetadata } from '../../models/game_state.dto';

@Component({
  selector: 'app-level-summary',
  imports: [],
  templateUrl: './level-summary.html',
  styleUrl: './level-summary.scss',
})
export class LevelSummary {
  readonly outcome = input.required<SemesterOutcome>();
  readonly level = input.required<number>();

  readonly onProceed = output<void>();
  readonly onClose = output<void>();

  readonly grade = computed(() => {
    const score = this.outcome().scoreChange;
    if (score >= 1000) return 'A+';
    if (score >= 800) return 'A';
    if (score >= 600) return 'B';
    if (score >= 400) return 'C';
    return 'D';
  });

  @HostListener('window:keydown.escape')
  handleEscKey() {
    this.onClose.emit();
  }
  skip() {
    this.onClose.emit();
  }
}
