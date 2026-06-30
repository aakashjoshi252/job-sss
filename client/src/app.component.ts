import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoadingService } from './core/services/loading.service';
import { LanguageService } from './core/i18n/language.service';
import { AppState } from './core/store/app.reducers';
import { AuthActions } from './core/store/auth/auth.actions';

@Component({
  selector: 'jc-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    @if (loading.isLoading()) {
      <div class="fixed inset-x-0 top-0 z-50 h-1 bg-teal-100">
        <div class="h-full w-2/3 animate-pulse bg-teal-600"></div>
      </div>
    }
    <router-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  readonly loading = inject(LoadingService);
  private readonly language = inject(LanguageService);
  private readonly store = inject(Store<AppState>);

  ngOnInit(): void {
    this.language.initialize();
    this.store.dispatch(AuthActions.hydrateSession());
  }
}
