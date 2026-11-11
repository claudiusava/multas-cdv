import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { euros } from '../core/multas';
import { Store } from '../core/store';

@Component({
  selector: 'app-bote',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = store.bote();
    <section class="bote">
      <div class="hucha" aria-hidden="true">🐷</div>
      <div class="bote-main">
        <span class="etq">Bote recaudado</span>
        <span class="bote-cifra">{{ euros(b.recaudado) }}</span>
        <div class="barra" [attr.aria-label]="pct() + '% cobrado'"><span [style.width.%]="pct()"></span></div>
      </div>
      <div class="bote-stats">
        <a routerLink="/multas">
          <strong>{{ euros(b.pendiente) }}</strong><small>pendiente · {{ b.numPendientes }}</small>
        </a>
        <span>
          <strong>{{ euros(b.total) }}</strong><small>total multas</small>
        </span>
        @if (b.numVencidas) {
          <a class="mal" routerLink="/multas">
            <strong>{{ b.numVencidas }}</strong><small>vencida{{ b.numVencidas === 1 ? '' : 's' }}</small>
          </a>
        }
      </div>
    </section>
  `,
})
export class Bote {
  protected readonly store = inject(Store);
  protected readonly euros = euros;
  protected readonly pct = computed(() => {
    const b = this.store.bote();
    return b.total ? Math.round((b.recaudado / b.total) * 100) : 0;
  });
}
