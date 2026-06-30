import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppComponent } from './app.component';
import { LanguageService } from './core/i18n/language.service';
import { LoadingService } from './core/services/loading.service';

describe('AppComponent', () => {
  it('creates the Angular application shell', async () => {
    const languageService = jasmine.createSpyObj<LanguageService>('LanguageService', ['initialize']);
    const store = jasmine.createSpyObj<Store>('Store', ['dispatch']);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: LoadingService,
          useValue: {
            isLoading: signal(false)
          }
        },
        {
          provide: LanguageService,
          useValue: languageService
        },
        {
          provide: Store,
          useValue: store
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(languageService.initialize).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalled();
  });
});
