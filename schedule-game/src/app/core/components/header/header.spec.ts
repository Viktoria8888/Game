import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    const mockAuthService = {
      isAnonymous: signal(false),
      logout: jasmine.createSpy('logout'),
      userId: 'test-user',
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('currentLevel', 1);
    fixture.componentRef.setInput('totalScore', 1000);
    fixture.componentRef.setInput('willpowerCost', 10);
    fixture.componentRef.setInput('willpowerBudget', 30);

    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Willpower Logic', () => {
    it('determines "safe" state (0-49%)', () => {
      fixture.componentRef.setInput('willpowerCost', 10);
      fixture.componentRef.setInput('willpowerBudget', 100);
      fixture.detectChanges();

      expect(component.willpowerState()).toBe('safe');
      expect(component.willpowerEmoji()).toBe('🔋');
    });

    it('determines "caution" state (50-79%)', () => {
      fixture.componentRef.setInput('willpowerCost', 50);
      fixture.componentRef.setInput('willpowerBudget', 100);
      fixture.detectChanges();

      expect(component.willpowerState()).toBe('caution');
      expect(component.willpowerEmoji()).toBe('⚡');
    });

    it('determines "danger" state (80-100%)', () => {
      fixture.componentRef.setInput('willpowerCost', 80);
      fixture.componentRef.setInput('willpowerBudget', 100);
      fixture.detectChanges();

      expect(component.willpowerState()).toBe('danger');
      expect(component.willpowerEmoji()).toBe('😓');
    });

    it('determines "critical" state (>100%)', () => {
      fixture.componentRef.setInput('willpowerCost', 101);
      fixture.componentRef.setInput('willpowerBudget', 100);
      fixture.detectChanges();

      expect(component.willpowerState()).toBe('critical');
      expect(component.willpowerEmoji()).toBe('💥');
    });
  });

  describe('Level Badge Logic', () => {
    it('returns "beginner" for levels <= 2', () => {
      fixture.componentRef.setInput('currentLevel', 2);
      fixture.detectChanges();

      expect(component.levelBadgeClass()).toBe('beginner');
    });

    it('returns "intermediate" for levels 3-4', () => {
      fixture.componentRef.setInput('currentLevel', 4);
      fixture.detectChanges();
      expect(component.levelBadgeClass()).toBe('intermediate');
    });

    it('returns "advanced" for levels 5-6', () => {
      fixture.componentRef.setInput('currentLevel', 6);
      fixture.detectChanges();
      expect(component.levelBadgeClass()).toBe('advanced');
    });
  });

  describe('User Display', () => {
    it('formats the score with commas', () => {
      fixture.componentRef.setInput('totalScore', 1234567);
      fixture.detectChanges();

      expect(component.formattedScore()).toBe('1,234,567');
    });

    it('generates initials from the user name', () => {
      fixture.componentRef.setInput('userName', 'John Doe');
      fixture.detectChanges();

      expect(component.userInitials()).toBe('JD');
    });

    it('uses only the first two initials if the name is long', () => {
      fixture.componentRef.setInput('userName', 'Jan Kowalski');
      fixture.detectChanges();

      expect(component.userInitials()).toBe('JK');
    });
  });

  describe('DOM Rendering', () => {
    it('renders the correct level in the DOM', () => {
      fixture.componentRef.setInput('currentLevel', 5);
      fixture.detectChanges();

      const levelEl = fixture.debugElement.query(By.css('.stat-item.level .stat-value'));
      expect(levelEl.nativeElement.textContent).toContain('5');
    });

    it('applies the correct state class to the willpower item', () => {
      fixture.componentRef.setInput('willpowerCost', 90);
      fixture.componentRef.setInput('willpowerBudget', 100);
      fixture.detectChanges();

      const willpowerItem = fixture.debugElement.query(By.css('.stat-item.willpower'));
      expect(willpowerItem.classes['danger']).toBeTrue();
    });

    it('renders initials when no avatar is provided', () => {
      fixture.componentRef.setInput('userName', 'Jan Kowalski');
      fixture.componentRef.setInput('userAvatar', undefined);
      fixture.detectChanges();

      const initialsEl = fixture.debugElement.query(By.css('.user-avatar.initials'));
      expect(initialsEl).toBeTruthy();
      expect(initialsEl.nativeElement.textContent.trim()).toBe('JK');
    });

  });
});
