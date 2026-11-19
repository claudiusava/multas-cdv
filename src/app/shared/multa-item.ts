import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { infraccion, jugador } from '../core/catalogo';
import { cuentaAtras, euros, Multa, msRestantes, vencimiento } from '../core/multas';
import { Store } from '../core/store';
import { Avatar } from './avatar';

@Component({
  selector: 'app-multa-item',
  imports: [Avatar, NgTemplateOutlet],
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
          <span>{{ fecha(m.fecha) }}</span>
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
        @if (m.borradoPor) {
          <div class="solicitud-borrado">
            🗑️ <strong>{{ m.borradoPor }}</strong> ha pedido borrarla.
            {{ m.borradoPor === yo() ? 'Falta que lo apruebe otro capitán o el entrenador.' : store.esAdmin() ? '¿La borras?' : 'Pendiente de aprobar.' }}
          </div>
        }
        @if (store.esAdmin() && m.importe > 0) {
          <div class="acciones">
            @if (!m.pagada) {
              <button class="btn btn-ok" (click)="pagar(true)" [disabled]="guardando()">💶 Cobrada</button>
            } @else {
              <button class="btn btn-ghost" (click)="pagar(false)" [disabled]="guardando()">Deshacer pago</button>
            }
            <ng-container *ngTemplateOutlet="botonesBorrar" />
          </div>
        } @else if (store.esAdmin()) {
          <div class="acciones">
            <ng-container *ngTemplateOutlet="botonesBorrar" />
          </div>
        }
        <ng-template #botonesBorrar>
          @if (!m.borradoPor) {
            <button class="btn btn-ghost peligro" (click)="borrar()" [disabled]="guardando()">Borrar</button>
          } @else if (m.borradoPor === yo()) {
            <button class="btn btn-ghost" (click)="cancelar('Solicitud cancelada')">Cancelar borrado</button>
          } @else {
            <button class="btn btn-peligro" (click)="aprobar()">🗑️ Aprobar borrado</button>
            <button class="btn btn-ghost" (click)="cancelar('Borrado rechazado: la multa se queda')">Rechazar</button>
          }
        </ng-template>
      </div>
    </article>
  `,
})
export class MultaItem {
  protected readonly store = inject(Store);
  readonly multa = input.required<Multa>();

  protected readonly euros = euros;
  protected readonly yo = computed(() => this.store.admin()?.nombre ?? '');
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
    if (!confirm(`¿Pedir borrar la multa de ${this.j().apodo} (${m.concepto})?\n\nOtro capitán o el entrenador tendrá que aprobarlo.`)) return;
    this.store.pedirBorrado(m).then((ok) => ok && this.store.avisar('Borrado pedido. Falta que lo apruebe otro.'));
  }

  protected aprobar(): void {
    const m = this.multa();
    if (!confirm(`${m.borradoPor} quiere borrar la multa de ${this.j().apodo} (${m.concepto}). ¿Lo apruebas? No se puede deshacer.`)) return;
    this.store.aprobarBorrado(m).then((ok) => ok && this.store.avisar('Multa borrada'));
  }

  protected cancelar(aviso: string): void {
    this.store.cancelarBorrado(this.multa()).then((ok) => ok && this.store.avisar(aviso));
  }
}
