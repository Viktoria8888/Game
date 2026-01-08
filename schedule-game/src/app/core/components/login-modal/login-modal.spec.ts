import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginModal } from './login-modal';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

describe('LoginModal', () => {
  let component: LoginModal;
  let fixture: ComponentFixture<LoginModal>;

  beforeEach(async () => {
    const mockAuthService = {
      isAnonymous: signal(true),
      login: jasmine.createSpy('login'),
      signUp: jasmine.createSpy('signUp'),
      upgradeToPermanent: jasmine.createSpy('upgradeToPermanent'),
    };

    await TestBed.configureTestingModule({
      imports: [LoginModal],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
