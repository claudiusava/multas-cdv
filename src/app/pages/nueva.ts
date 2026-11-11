import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AMBITOS, INFRACCIONES, Infraccion, JUGADORES, PLAZO_DIAS, jugador } from '../core/catalogo';
import { euros } from '../core/multas';
import { Store } from '../core/store';
import { Avatar } from '../shared/avatar';

@Component({
  selector: 'app-nueva',
  imports: [Avatar, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!store.esAdmin()) {
      <section class="tarjeta centro">
        <p>🔒 Solo los capitanes y el entrenador pueden poner multas.</p>
        <a class="btn btn-primario" routerLink="/acceso">Soy responsable</a>
      </section>
    } @else {
      <h2 class="titulo">1 · ¿A quién multamos?</h2>
      <div class="rejilla-jugadores">
        @for (j of jugadores; track j.id) {
          <button type="button" [class.on]="jugadorId() === j.id" (click)="jugadorId.set(j.id)">
            <app-avatar [jugador]="j" [size]="44" />
            @let partes = j.apodo.split(' (');
            <span>{{ partes[0] }}</span>
            @if (partes[1]) { <small class="rol-ficha">({{ partes[1] }}</small> }
          </button>
        }
      </div>

      <h2 class="titulo">2 · ¿Qué ha hecho?</h2>
      @for (a of ambitos; track a) {
        <h3 class="subtitulo">{{ a }}</h3>
        <div class="opciones">
          @for (i of porAmbito(a); track i.id) {
            <button type="button" class="opcion" [class.on]="infId() === i.id" (click)="elegir(i)">
              <span class="op-texto">{{ i.concepto }}</span>
              <span class="op-importe">{{ i.libre ? '¿?' : i.importe ? euros(i.importe) + (i.porUnidad ? '/' + i.porUnidad : '') : 'Sanción' }}</span>
            </button>
          }
        </div>
      }

      @if (inf(); as i) {
        <h2 class="titulo">3 · Detalles</h2>
        <div class="tarjeta form">
          @if (i.porUnidad) {
            <label>Nº de {{ i.porUnidad }}s
              <div class="contador">
                <button type="button" (click)="unidades.set(max1(unidades() - 1))">−</button>
                <strong>{{ unidades() }}</strong>
                <button type="button" (click)="unidades.set(unidades() + 1)">+</button>
              </div>
            </label>
          }
          @if (i.libre) {
            <label>Concepto
              <input type="text" [(ngModel)]="conceptoLibre" maxlength="120" placeholder="¿Qué ha pasado?" />
            </label>
            <label>Importe (€)
              <input type="number" inputmode="decimal" min="0" step="0.5" [ngModel]="importeLibre()" (ngModelChange)="importeLibre.set($event)" />
            </label>
          }
          <label>Nota (opcional)
            <textarea rows="2" [(ngModel)]="nota" maxlength="300" placeholder="Ej.: llegó 20 min tarde al calentamiento"></textarea>
          </label>
          @if (i.extra) {
            <p class="extra">⚠️ Además: {{ i.extra }}</p>
          }
        </div>
      }

      @if (j() && inf()) {
        <div class="confirmar">
          <app-avatar [jugador]="j()!" [size]="48" />
          <p>
            <strong>{{ j()!.apodo }}</strong>
            @if (importe() > 0) {
              debe <strong class="debe">{{ euros(importe()) }}</strong> de multa
              <small>Plazo de pago: {{ plazo }} días</small>
            } @else {
              recibe una sanción sin importe
            }
          </p>
          <button class="btn btn-primario" (click)="guardar()" [disabled]="!valida() || guardando()">
            {{ guardando() ? 'Guardando…' : 'Poner multa' }}
          </button>
        </div>
      }
    }
  `,
})
export class NuevaPage {
  protected readonly store = inject(Store);
  private readonly router = inject(Router);
  protected readonly euros = euros;
  protected readonly jugadores = JUGADORES;
  protected readonly ambitos = AMBITOS;
  protected readonly plazo = PLAZO_DIAS;

  /** ?j=<jugadorId> preselecciona. */
  readonly j$ = input<string>(undefined, { alias: 'j' });

  protected readonly jugadorId = signal<string | null>(null);
  protected readonly infId = signal<string | null>(null);
  protected readonly unidades = signal(1);
  protected readonly guardando = signal(false);
  protected conceptoLibre = '';
  protected readonly importeLibre = signal<number | null>(null);
  protected nota = '';

  constructor() {
    effect(() => {
      const id = this.j$();
      if (id) this.jugadorId.set(id);
    });
  }

  protected readonly j = computed(() => (this.jugadorId() ? jugador(this.jugadorId()!) : null));
  protected readonly inf = computed(() => INFRACCIONES.find((i) => i.id === this.infId()) ?? null);
  protected readonly importe = computed(() => {
    const i = this.inf();
    if (!i) return 0;
    if (i.libre) return Math.max(0, Number(this.importeLibre()) || 0);
    return i.importe * (i.porUnidad ? this.unidades() : 1);
  });

  protected porAmbito(a: string): Infraccion[] {
    return INFRACCIONES.filter((i) => i.ambito === a);
  }

  protected max1(n: number): number {
    return Math.max(1, n);
  }

  protected elegir(i: Infraccion): void {
    this.infId.set(i.id);
    this.unidades.set(1);
    setTimeout(() => document.querySelector('.confirmar')?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
  }

  protected valida(): boolean {
    const i = this.inf();
    if (!this.jugadorId() || !i) return false;
    if (i.libre) return !!this.conceptoLibre.trim() && (this.importeLibre() ?? -1) >= 0;
    return true;
  }

  protected guardar(): void {
    const i = this.inf();
    const j = this.j();
    // Un doble toque nervioso no debe crear la multa dos veces.
    if (!i || !j || !this.valida() || this.guardando()) return;
    this.guardando.set(true);
    const importe = this.importe();
    const concepto = i.libre
      ? this.conceptoLibre.trim()
      : i.porUnidad && this.unidades() > 1
        ? `${i.concepto} (×${this.unidades()} ${i.porUnidad}s)`
        : i.concepto;
    const j2 = j;
    this.store.nuevaMulta({ jugadorId: j.id, jugador: j.apodo, infraccionId: i.id, concepto, importe, nota: this.nota.trim() }).then(
      (ok) => ok && this.store.avisar(importe > 0 ? `✅ ${j2.apodo} debe ${euros(importe)}` : `✅ Sanción registrada a ${j2.apodo}`),
    );
    this.router.navigate(['/multas']);
  }
}
