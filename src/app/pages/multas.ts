import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { euros, ordenarListado } from '../core/multas';
import { Store } from '../core/store';
import { MultaItem } from '../shared/multa-item';

@Component({
  selector: 'app-multas',
  imports: [MultaItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = store.bote();
    <div class="leyenda">
      <span class="punto mal"></span> Vencidas {{ b.numVencidas }}
      <span class="punto aviso"></span> En plazo {{ b.numPendientes - b.numVencidas }}
      <span class="punto ok"></span> Pagadas {{ numPagadas() }}
    </div>
    @if (b.pendiente > 0) {
      <p class="resumen">Pendiente de cobro: <strong>{{ euros(b.pendiente) }}</strong></p>
    }

    <div class="lista-multas">
      @for (m of visibles(); track m.id) {
        <app-multa-item [multa]="m" />
      } @empty {
        @if (store.cargadoUnaVez()) {
          <p class="vacio">No hay multas registradas. 😇</p>
        }
      }
    </div>
    @if (ocultas() > 0) {
      <button class="btn btn-ghost ver-mas" (click)="limite.set(limite() + PASO)">
        Ver {{ ocultas() > PASO ? PASO + ' más' : 'las ' + ocultas() + ' restantes' }} ({{ ocultas() }} pagadas sin mostrar)
      </button>
    }
  `,
})
export class MultasPage {
  protected readonly store = inject(Store);
  protected readonly euros = euros;
  protected readonly lista = computed(() => ordenarListado(this.store.multas()));
  protected readonly numPagadas = computed(() => this.store.multas().filter((m) => m.pagada).length);

  /** Las pendientes se ven siempre; de las pagadas (abajo) solo las más recientes, para ir fluido. */
  protected readonly PASO = 30;
  protected readonly limite = signal(this.PASO);
  private readonly noPagadas = computed(() => this.lista().filter((m) => !m.pagada).length);
  protected readonly visibles = computed(() => this.lista().slice(0, this.noPagadas() + this.limite()));
  protected readonly ocultas = computed(() => this.lista().length - this.visibles().length);
}
