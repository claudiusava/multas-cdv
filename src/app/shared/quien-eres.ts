import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { jugador } from '../core/catalogo';
import { Store } from '../core/store';
import { Avatar } from './avatar';

export const OPCIONES_RESPONSABLE = [
  { nombre: 'Clau', rol: 'Capitán', jugadorId: 'sava-claudiu' },
  { nombre: 'David', rol: 'Capitán', jugadorId: 'navarro-cedillo-david' },
  { nombre: 'Sergio', rol: 'Capitán', jugadorId: 'vazquez-sergio' },
  { nombre: 'Gabi', rol: 'Entrenador', jugadorId: null },
] as const;

/** Pantalla "¿Quién eres?" para autorizar el móvil de un responsable. */
@Component({
  selector: 'app-quien-eres',
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="quien-eres">
      <img src="escudo.png" alt="" class="qe-escudo" width="80" height="94" />
      <h2>¿Quién eres?</h2>
      <p class="ayuda">Elige tu nombre para autorizar este móvil. Solo se hace una vez.</p>

      <div class="qe-opciones">
        @for (o of opciones; track o.nombre) {
          @let libre = store.libres().includes(o.nombre);
          <button type="button" class="qe-op" [disabled]="!libre || enviando()" (click)="elegir(o.nombre)">
            @if (o.jugadorId) {
              <app-avatar [jugador]="j(o.jugadorId)" [size]="52" />
            } @else {
              <span class="qe-gorra">🧢</span>
            }
            <span class="qe-nombre">
              <strong>{{ o.nombre }}</strong>
              <small>{{ libre ? '(' + o.rol + ')' : 'Ya autorizado ✓' }}</small>
            </span>
          </button>
        }
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <button type="button" class="btn btn-ghost qe-solo-ver" (click)="soloVer()" [disabled]="enviando()">
        Soy jugador, solo quiero ver las multas
      </button>
    </div>
  `,
})
export class QuienEres {
  protected readonly store = inject(Store);
  readonly hecho = output<void>();
  protected readonly opciones = OPCIONES_RESPONSABLE;
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected j = jugador;

  protected async elegir(nombre: string): Promise<void> {
    if (!confirm(`¿Eres ${nombre}? Este móvil quedará autorizado para poner y cobrar multas.`)) return;
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.store.registrar(nombre);
      this.hecho.emit();
    } catch (e) {
      this.error.set((e as Error).message);
      await this.store.cargar(true);
    } finally {
      this.enviando.set(false);
    }
  }

  protected soloVer(): void {
    this.store.marcarVisto();
    this.hecho.emit();
  }
}
