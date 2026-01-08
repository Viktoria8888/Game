import { Component, HostListener, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorial.html',
  styleUrl: './tutorial.scss',
})
export class TutorialComponent {
  readonly close = output();

  protected currentStep = signal(0);

  protected readonly steps = [
    {
      title: 'Welcome to The Schedule Game',
      icon: '🎓',
      content:
        'Your goal is to survive 6 semesters (Levels) by creating the perfect class schedule. You must balance <strong>Academic Requirements</strong> with your <strong>Mental Health (Willpower)</strong> by picking courses. <br> Each course has set time, so do not even try to drag them :0 <br> ',
    },
    {
      title: 'Rules & Constraints',
      icon: '📋',
      content:
        'Each level has <strong>Mandatory</strong> rules you MUST satisfy to pass.<br>There are also <strong>Goal</strong> rules (optional) that give you huge score bonuses. Try to solve them all! <br> To delete the course, just double click on it',
    },
    {
      title: 'Willpower Budget',
      icon: '🔋',
      content:
        'Every difficult schedule choice costs <strong>Willpower</strong>. If your cost exceeds the semester budget, you cannot pass the level.<br>Manage your stress wisely!',
    },
    {
      title: 'The Cost of Stress',
      icon: '⚡',
      content: `
        <div class="cost-grid">
          <div class="item">
            <div><strong>Early Riser</strong><br><small>Classes starting at 8:00</small></div>
            <span class="val">2</span>
          </div>
          <div class="item">
            <div><strong>Night Shift</strong><br><small>Classes ending after 18:00</small></div>
            <span class="val">3</span>
          </div>
          <div class="item">
            <div><strong>Friday Drag</strong><br><small>Late classes on Friday</small></div>
            <span class="val">4</span>
          </div>
          <div class="item">
            <div><strong>Commuter Tax</strong><br><small>Campus trip for just 1 class</small></div>
            <span class="val">1</span>
          </div>
          <div class="item">
            <div><strong>Starvation</strong><br><small>6+ hours without a break</small></div>
            <span class="val">5</span>
          </div>
          <div class="item">
            <div><strong>Awkward Gap</strong><br><small>Useless 1 hour gap</small></div>
            <span class="val">1</span>
          </div>
          <div class="item">
            <div><strong>Huge Gap</strong><br><small>Boring 3+ hour gap</small></div>
            <span class="val">2</span>
          </div>
          <div class="item">
            <div><strong>The Clopen</strong><br><small>Late night then early morning</small></div>
            <span class="val">3</span>
          </div>
          <div class="item">
            <div><strong>Exam Stress</strong><br><small>Cost per exam taken</small></div>
            <span class="val">1</span>
          </div>
        </div>
      `,
    },
    {
      title: 'How to Play',
      icon: '🖱️',
      content:
        '1. <strong>Click</strong> courses in the list to add them.<br>2. <strong>Watch</strong> the Schedule Grid for conflicts and if any of your constraints are satisfied.<br>3. <strong>Check</strong> the Header for your Willpower status.<br>4. Click <strong>"Go to next level"</strong> when satisfied.',
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
}
