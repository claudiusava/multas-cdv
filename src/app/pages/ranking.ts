import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { euros } from '../core/multas';
import { Store } from '../core/store';
import { Avatar } from '../shared/avatar';
import { Bote } from '../shared/bote';

@Component({
  selector: 'app-ranking',
  imports: [Avatar, Bote],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-bote />

    <h2 class="titulo">🏆 Ranking de multados</h2>
    @if (podio().length) {
      <div class="podio">
        @for (f of podio(); track f.jugador.id) {
          <div class="escalon e{{ f.posicion }}">
            <span class="corona">{{ ['🥇', '🥈', '🥉'][f.posicion - 1] }}</span>
            <app-avatar [jugador]="f.jugador" [size]="f.posicion === 1 ? 72 : 56" />
            <strong>{{ f.jugador.apodo }}</strong>
            <span class="cifra">{{ euros(f.total) }}</span>
            <small class="podio-debe" [class.mal]="f.pendiente > 0">
              {{ f.pendiente > 0 ? 'debe ' + euros(f.pendiente) : 'al día ✓' }}
            </small>
            <span class="peana">{{ f.posicion }}</span>
          </div>
        }
      </div>
    } @else if (store.cargadoUnaVez()) {
      <p class="vacio">Nadie ha sido multado todavía. ¡Equipo ejemplar! 😇</p>
    }

    <ol class="lista-ranking">
      @for (f of resto(); track f.jugador.id) {
        <li [class.limpio]="f.total === 0">
          <span class="pos">{{ f.posicion }}</span>
          <app-avatar [jugador]="f.jugador" [size]="38" />
          <span class="nombre">
            <strong>{{ f.jugador.apodo }}</strong>
            <small>
              @if (f.numMultas) {
                {{ f.numMultas }} multa{{ f.numMultas === 1 ? '' : 's' }}
                @if (f.pendiente > 0) {
                  · <b class="debe" [class.mal]="f.vencidas > 0">debe {{ euros(f.pendiente) }}</b>
                } @else {
                  · al día ✓
                }
              } @else {
                Sin multas 😇
              }
            </small>
          </span>
          @if (f.vencidas) { <span class="chip mal mini">⏰ {{ f.vencidas }}</span> }
          <span class="cifra">{{ euros(f.total) }}</span>
        </li>
      }
    </ol>
  `,
})
export class RankingPage {
  protected readonly store = inject(Store);
  protected readonly euros = euros;
  private readonly conMultas = computed(() => this.store.ranking().filter((f) => f.total > 0));
  protected readonly podio = computed(() => {
    const top = this.conMultas().filter((f) => f.posicion <= 3).slice(0, 3);
    // Orden visual 2-1-3
    return top.length === 3 ? [top[1], top[0], top[2]] : top;
  });
  protected readonly resto = computed(() => {
    const enPodio = new Set(this.podio().map((f) => f.jugador.id));
    return this.store.ranking().filter((f) => !enPodio.has(f.jugador.id));
  });
}
