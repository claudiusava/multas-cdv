import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { jugador } from '../core/catalogo';
import { Store } from '../core/store';
import { Avatar } from './avatar';

export const OPCIONES_RESPONSABLE = [
  { nombre: 'Clau', rol: 'Capitán', jugadorId: 'sava-claudiu' },
  { nombre: 'David', rol: 'Capitán', jugadorId: 'navarro-cedillo-david' },
  { nombre: 'Sergio', rol: 'Capitán', jugadorId: 'vazquez-sergio' },
  { nombre: 'Gabi', rol: 'Entrenador', jugadorId: 'gabi' },
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
        @for (o of opciones(); track o.nombre) {
          <button type="button" class="qe-op" [disabled]="enviando()" (click)="elegir(o.nombre)">
            <app-avatar [jugador]="j(o.jugadorId, o.nombre)" [size]="52" />
            <span class="qe-nombre">
              <strong>{{ o.nombre }}</strong>
              <small>({{ o.rol }}){{ o.rol === 'Entrenador' ? ' 🧢' : '' }}</small>
            </span>
          </button>
        }
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
  `,
})
export class QuienEres {
  protected readonly store = inject(Store);
  readonly hecho = output<void>();
  /** Solo los nombres que aún no tienen móvil autorizado. */
  protected readonly opciones = computed(() => OPCIONES_RESPONSABLE.filter((o) => this.store.libres().includes(o.nombre)));
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected j(id: string, _nombre: string) {
    return jugador(id);
  }

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

}
