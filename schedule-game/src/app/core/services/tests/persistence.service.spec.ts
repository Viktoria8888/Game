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
      isInitialized: signal(false),
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

  describe('Effect():', () => {
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

    it('saves to Firestore after 500ms debounce', fakeAsync(() => {
      setup();
      const newState = { level: 2 } as GameStateDTO;
      mockGameService.gameStateSnapshot.set(newState);

      tick(499);
      expect(mockFirestoreService.set).not.toHaveBeenCalled();

      tick(1);
      expect(mockFirestoreService.set).toHaveBeenCalledWith(
        'test-user-id',
        jasmine.objectContaining(newState)
      );
    }));

    it('does not echo remote changes back to Firestore (isRestoring check)', fakeAsync(() => {
      setup();
      const remoteState = { level: 99 } as GameStateDTO;
      mockGameService.restoreState.and.callFake((state: GameStateDTO) => {
        mockGameService.gameStateSnapshot.set(state);
      });
      // This calls updateLocalState -> sets isRestoring=true -> updates Signal -> schedules setTimeout
      firestoreCallback(remoteState);
      // At this exact moment:
      // - The Signal has updated.
      // - The saveSubscription pipeline has fired.
      // - It hits the filter: filter(() => !this.isRestoring)
      // - Since isRestoring is TRUE, the  should be blocked immediately.

      // Advance time past the debounce
      // This also flushes the setTimeout(0) which resets the flag to false
      tick(500);
      expect(mockFirestoreService.set).not.toHaveBeenCalled();
    }));

    it('does save local changes initiated by the user', fakeAsync(() => {
      setup();

      // (Signal updates WITHOUT firestoreCallback)
      mockGameService.gameStateSnapshot.set({ level: 5 });

      tick(500);
      expect(mockFirestoreService.set).toHaveBeenCalled();
    }));
  });
});
