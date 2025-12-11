import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PersistenceService } from '../persistence.service';
import { provideZonelessChangeDetection, signal, Signal } from '@angular/core';
import { GameStateDTO } from '../../models/game_state.dto';
import { GameService } from '../game.service';
import { FirestoreService } from '../firestore.service';
import { AuthService } from '../auth.service';

describe('PersistenceService', () => {
  let service: PersistenceService;
  let mockGameService: any;
  let mockFirestoreService: any;
  let mockAuthService: any;

  let firestoreCallback: (data: any) => void;

  beforeEach(fakeAsync(() => {
    mockGameService = {
      gameStateSnapshot: signal({} as GameStateDTO),
      restoreState: jasmine.createSpy('restoreState'),
      markAsInitialized: jasmine.createSpy('markAsInitialized'),
    };

    mockAuthService = {
      get userId() {
        return 'test-user-id';
      },
      signInAnonymously: jasmine.createSpy('signInAnonymously'),
    };

    mockFirestoreService = jasmine.createSpyObj('FirestoreService', [
      'get',
      'set',
      'subscribeToUser',
    ]);

    mockFirestoreService.get.and.returnValue(Promise.resolve(null));

    mockFirestoreService.set.and.returnValue(Promise.resolve());

    mockFirestoreService.subscribeToUser.and.callFake((id: string, cb: any) => {
      firestoreCallback = cb;
      return jasmine.createSpy('unsubscribe');
    });

    TestBed.configureTestingModule({
      providers: [
        PersistenceService,
        provideZonelessChangeDetection(),

        { provide: GameService, useValue: mockGameService },
        { provide: FirestoreService, useValue: mockFirestoreService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  }));

  describe('effect():', () => {
    const setup = () => {
      const s = TestBed.inject(PersistenceService);
      tick();
      return s;
    };
    it('loadState calls firestore get', fakeAsync(() => {
      setup();
      expect(mockFirestoreService.get).toHaveBeenCalledWith('test-user-id');
    }));

    it('subscribeToRemoteChanges calls firestore subscribeToUser', fakeAsync(() => {
      setup();
      expect(mockFirestoreService.subscribeToUser).toHaveBeenCalled();
    }));

    it('saves to Firestore after 2000ms debounce', fakeAsync(() => {
      setup();
      const newState = { level: 2 } as GameStateDTO;

      mockGameService.gameStateSnapshot.set(newState);
      tick(1999);

      expect(mockFirestoreService.set).not.toHaveBeenCalled();

      tick(1);
      expect(mockFirestoreService.set).toHaveBeenCalledWith(
        'test-user-id',
        jasmine.objectContaining(newState)
      );
    }));
    // add test for isRestoring flag
  });
});
