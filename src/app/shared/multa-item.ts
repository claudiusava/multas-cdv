import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { infraccion, jugador } from '../core/catalogo';
import { cuentaAtras, euros, Multa, msRestantes, vencimiento } from '../core/multas';
import { Store } from '../core/store';
import { Avatar } from './avatar';

@Component({
  selector: 'app-multa-item',
  imports: [Avatar, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = multa();
    <article class="multa" [class.pagada]="m.pagada" [class.vencida]="estado() === 'vencida'">
      <a class="quien" [routerLink]="['/jugador', m.jugadorId]">
        <app-avatar [jugador]="j()" [size]="42" />
      </a>
      <div class="cuerpo">
        <div class="linea1">
          <a class="apodo" [routerLink]="['/jugador', m.jugadorId]">{{ j().apodo }}</a>
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
              <button class="btn btn-ok" (click)="pagar(true)" [disabled]="ocupado()">💶 Cobrada</button>
            } @else {
              <button class="btn btn-ghost" (click)="pagar(false)" [disabled]="ocupado()">Deshacer pago</button>
            }
            <button class="btn btn-ghost peligro" (click)="borrar()" [disabled]="ocupado()">Borrar</button>
          </div>
        } @else if (store.esAdmin()) {
          <div class="acciones">
            <button class="btn btn-ghost peligro" (click)="borrar()" [disabled]="ocupado()">Borrar</button>
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
  protected readonly ocupado = signal(false);
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

  protected async pagar(pagada: boolean): Promise<void> {
    this.ocupado.set(true);
    try {
      await this.store.marcarPagada(this.multa(), pagada);
      this.store.avisar(pagada ? `💶 ${euros(this.multa().importe)} al bote. ¡Gracias ${this.j().apodo}!` : 'Pago deshecho');
    } catch (e) {
      this.store.avisar((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }

  protected async borrar(): Promise<void> {
    const m = this.multa();
    if (!confirm(`¿Borrar la multa de ${this.j().apodo} (${m.concepto})? No se puede deshacer.`)) return;
    this.ocupado.set(true);
    try {
      await this.store.borrar(m);
      this.store.avisar('Multa borrada');
    } catch (e) {
      this.store.avisar((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
}
