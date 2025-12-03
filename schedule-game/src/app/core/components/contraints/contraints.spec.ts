import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contraints } from './contraints';

describe('Contraints', () => {
  let component: Contraints;
  let fixture: ComponentFixture<Contraints>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contraints]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contraints);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
