import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { infraccion, jugador } from '../core/catalogo';
import { cuentaAtras, euros, Multa, msRestantes, vencimiento } from '../core/multas';
import { Store } from '../core/store';
import { Avatar } from './avatar';

@Component({
  selector: 'app-multa-item',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = multa();
    <article class="multa {{ estado() }}">
      <app-avatar [jugador]="j()" [size]="42" />
      <div class="cuerpo">
        <div class="linea1">
          <span class="apodo">{{ j().apodo }}</span>
          <span class="importe">{{ m.importe > 0 ? euros(m.importe) : 'Sanción' }}</span>
        </div>
        <div class="concepto">{{ m.concepto }}</div>
        @if (extra(); as e) {
          <div class="extra">⚠️ {{ e }}</div>
        }
        @if (m.nota) {
          <div class="nota">“{{ m.nota }}”</div>
        }
        <div class="meta">
          <span>{{ fecha(m.fecha) }} · por {{ m.creadaPor }}</span>
          @if (guardando()) { <span class="guardando">· guardando…</span> }
        </div>
        <div class="estado">
          @switch (estado()) {
            @case ('pagada') {
              <span class="chip ok">✓ Pagada {{ m.fechaPago ? fechaCorta(m.fechaPago) : '' }}{{ m.cobradaPor ? ' · ' + m.cobradaPor : '' }}</span>
            }
            @case ('deportiva') {
              <span class="chip info">Sin importe</span>
            }
            @case ('vencida') {
              <span class="chip mal">⏰ {{ restante() }}</span>
            }
            @default {
              <span class="chip" [class.aviso]="urgente()">⏳ {{ restante() }} para pagar</span>
            }
          }
          @if (!m.pagada && m.importe > 0) {
            <span class="limite">hasta el {{ fechaCorta(limite()) }}</span>
          }
        </div>
        @if (store.esAdmin() && m.importe > 0) {
          <div class="acciones">
            @if (!m.pagada) {
              <button class="btn btn-ok" (click)="pagar(true)" [disabled]="guardando()">💶 Cobrada</button>
            } @else {
              <button class="btn btn-ghost" (click)="pagar(false)" [disabled]="guardando()">Deshacer pago</button>
            }
            <button class="btn btn-ghost peligro" (click)="borrar()" [disabled]="guardando()">Borrar</button>
          </div>
        } @else if (store.esAdmin()) {
          <div class="acciones">
            <button class="btn btn-ghost peligro" (click)="borrar()" [disabled]="guardando()">Borrar</button>
          </div>
        }
      </div>
    </article>
  `,
})
export class MultaItem {
  protected readonly store = inject(Store);
  readonly multa = input.required<Multa>();

  protected readonly euros = euros;
  /** Recién creada: aún sin id del servidor. */
  protected readonly guardando = computed(() => this.multa().id.startsWith('tmp-'));
  protected readonly j = computed(() => jugador(this.multa().jugadorId));
  protected readonly extra = computed(() => infraccion(this.multa().infraccionId)?.extra);
  protected readonly limite = computed(() => vencimiento(this.multa()).toISOString());
  protected readonly ms = computed(() => msRestantes(this.multa(), this.store.ahora()));
  protected readonly restante = computed(() => cuentaAtras(this.ms()));
  protected readonly urgente = computed(() => this.ms() < 2 * 86_400_000);
  protected readonly estado = computed(() => {
    const m = this.multa();
    if (m.pagada) return 'pagada';
    if (m.importe === 0) return 'deportiva';
    return this.ms() <= 0 ? 'vencida' : 'pendiente';
  });

  protected fecha(iso: string): string {
    return new Date(iso).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  protected fechaCorta(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  protected pagar(pagada: boolean): void {
    const m = this.multa();
    const apodo = this.j().apodo;
    this.store.marcarPagada(m, pagada).then((ok) => ok && pagada && this.store.avisar(`💶 ${euros(m.importe)} al bote. ¡Gracias ${apodo}!`));
    if (!pagada) this.store.avisar('Pago deshecho');
  }

  protected borrar(): void {
    const m = this.multa();
    if (!confirm(`¿Borrar la multa de ${this.j().apodo} (${m.concepto})? No se puede deshacer.`)) return;
    this.store.borrar(m).then((ok) => ok && this.store.avisar('Multa borrada'));
  }
}
