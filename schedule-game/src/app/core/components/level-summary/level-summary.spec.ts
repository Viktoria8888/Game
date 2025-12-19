import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LevelSummary } from './level-summary';

describe('LevelSummary', () => {
  let component: LevelSummary;
  let fixture: ComponentFixture<LevelSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LevelSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
