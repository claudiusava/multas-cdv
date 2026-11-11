import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { jugador } from '../core/catalogo';
import { euros } from '../core/multas';
import { Store } from '../core/store';
import { Avatar } from '../shared/avatar';
import { MultaItem } from '../shared/multa-item';

@Component({
  selector: 'app-jugador',
  imports: [Avatar, MultaItem, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let f = fila();
    <section class="ficha">
      <app-avatar [jugador]="j()" [size]="96" />
      <h2>{{ j().apodo }}</h2>
      <p class="nombre-completo">{{ j().nombre }}</p>
      @if (f) {
        <p class="posicion">{{ f.total > 0 ? f.posicion + 'º en el ranking' : 'Sin multas · ¡ejemplar!' }}</p>
        <div class="ficha-stats">
          <div><strong>{{ euros(f.total) }}</strong><small>total</small></div>
          <div [class.mal]="f.pendiente > 0"><strong>{{ euros(f.pendiente) }}</strong><small>debe</small></div>
          <div><strong>{{ euros(f.pagado) }}</strong><small>pagado</small></div>
        </div>
      }
      @if (store.esAdmin()) {
        <a class="btn btn-primario" routerLink="/nueva" [queryParams]="{ j: j().id }">➕ Multar a {{ j().apodo }}</a>
      }
    </section>

    <div class="lista-multas">
      @for (m of multas(); track m.id) {
        <app-multa-item [multa]="m" />
      } @empty {
        <p class="vacio">{{ j().apodo }} no tiene multas. 😇</p>
      }
    </div>
  `,
})
export class JugadorPage {
  protected readonly store = inject(Store);
  protected readonly euros = euros;
  readonly id = input.required<string>();
  protected readonly j = computed(() => jugador(this.id()));
  protected readonly fila = computed(() => this.store.ranking().find((f) => f.jugador.id === this.id()));
  protected readonly multas = computed(() => {
    const lista = this.store.ordenadas().filter((m) => m.jugadorId === this.id());
    // pendientes primero
    return [...lista.filter((m) => !m.pagada && m.importe > 0), ...lista.filter((m) => m.pagada || m.importe === 0)];
  });
}
