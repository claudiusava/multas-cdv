import { ChangeDetectionStrategy, Component, computed, inject, input, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { euros } from '../core/multas';
import { Store } from '../core/store';
import { MultaItem } from '../shared/multa-item';

type Vista = 'pendientes' | 'pagadas' | 'todas';

@Component({
  selector: 'app-multas',
  imports: [MultaItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="segmentos" role="tablist">
      <button role="tab" [class.on]="vista() === 'pendientes'" (click)="cambiar('pendientes')">
        En curso <span class="cnt">{{ store.pendientes().length }}</span>
      </button>
      <button role="tab" [class.on]="vista() === 'pagadas'" (click)="cambiar('pagadas')">
        Pagadas <span class="cnt">{{ store.pagadas().length }}</span>
      </button>
      <button role="tab" [class.on]="vista() === 'todas'" (click)="cambiar('todas')">
        Histórico <span class="cnt">{{ store.multas().length }}</span>
      </button>
    </div>

    @if (vista() === 'pendientes' && lista().length) {
      <p class="resumen">Pendiente de cobro: <strong>{{ euros(store.bote().pendiente) }}</strong></p>
    }

    <div class="lista-multas">
      @for (m of lista(); track m.id) {
        <app-multa-item [multa]="m" />
      } @empty {
        @if (store.cargadoUnaVez()) {
          <p class="vacio">
            @switch (vista()) {
              @case ('pendientes') { Ninguna multa pendiente. 🎉 }
              @case ('pagadas') { Aún no se ha pagado ninguna multa. }
              @default { No hay multas registradas. }
            }
          </p>
        }
      }
    </div>
  `,
})
export class MultasPage {
  protected readonly store = inject(Store);
  private readonly router = inject(Router);
  protected readonly euros = euros;

  /** Query param ?v= */
  readonly v = input<string>();
  protected readonly vista = signal<Vista>('pendientes');

  constructor() {
    effect(() => {
      const v = this.v();
      if (v === 'pendientes' || v === 'pagadas' || v === 'todas') this.vista.set(v);
    });
  }

  protected readonly lista = computed(() => {
    switch (this.vista()) {
      case 'pendientes': return this.store.pendientes();
      case 'pagadas': return this.store.pagadas();
      default: return this.store.ordenadas();
    }
  });

  protected cambiar(v: Vista): void {
    this.vista.set(v);
    this.router.navigate([], { queryParams: { v }, replaceUrl: true });
  }
}
