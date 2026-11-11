import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
      @for (m of lista(); track m.id) {
        <app-multa-item [multa]="m" />
      } @empty {
        @if (store.cargadoUnaVez()) {
          <p class="vacio">No hay multas registradas. 😇</p>
        }
      }
    </div>
  `,
})
export class MultasPage {
  protected readonly store = inject(Store);
  protected readonly euros = euros;
  protected readonly lista = computed(() => ordenarListado(this.store.multas()));
  protected readonly numPagadas = computed(() => this.store.multas().filter((m) => m.pagada).length);
}
