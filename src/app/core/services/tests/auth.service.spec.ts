import { TestBed } from '@angular/core/testing';
import { Auth, User } from '@angular/fire/auth';
import { AuthService } from '../auth.service';

const mockUser = (options: Partial<User>): User => {
  return options as User;
};

describe('AuthService', () => {
  let service: AuthService;
  let authSpy: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('Auth', ['currentUser', 'onAuthStateChanged']);

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: Auth, useValue: authSpy }],
    });

    service = TestBed.inject(AuthService);
  });

  describe('Username (computed)', () => {
    it('returns "Guest" when no user is logged in', () => {
      service.user.set(null);

      expect(service.username()).toBe('Guest');
    });

    it('returns the displayName if available', () => {
      service.user.set(mockUser({ displayName: 'SuperStar' }));

      expect(service.username()).toBe('SuperStar');
    });

    it('returns the email prefix if displayName is missing', () => {
      service.user.set(
        mockUser({
          displayName: null,
          email: 'john.doe@example.com',
        })
      );

      expect(service.username()).toBe('john.doe');
    });

    it('returns "Player" + first 4 chars of UID if anonymous', () => {
      service.user.set(
        mockUser({
          displayName: null,
          email: null,
          isAnonymous: true,
          uid: 'abc123xyz',
        })
      );

      expect(service.username()).toBe('Playerabc1');
    });

    it('defaults to "Player" if no other info is available', () => {
      service.user.set(
        mockUser({
          displayName: null,
          email: null,
          isAnonymous: false,
        })
      );

      expect(service.username()).toBe('Player');
    });
  });

  describe('Public API', () => {
    it('userId returns the uid when user is logged in', () => {
      service.user.set(mockUser({ uid: '12345' }));

      expect(service.userId).toBe('12345');
    });

    it('userId returns null when logged out', () => {
      service.user.set(null);

      expect(service.userId).toBeNull();
    });
  });
});
