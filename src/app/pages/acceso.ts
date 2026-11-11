import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JUGADORES } from '../core/catalogo';
import { Store } from '../core/store';

@Component({
  selector: 'app-acceso',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.admin(); as a) {
      <section class="tarjeta centro">
        <p class="grande">🛡️</p>
        <h2>{{ a.nombre }}</h2>
        <p>{{ a.rol }} · este móvil puede poner y cobrar multas.</p>
        <button class="btn btn-ghost peligro" (click)="salir()">Quitar acceso de este móvil</button>
        <small class="ayuda">Libera tu plaza para poder darte de alta en otro móvil.</small>
      </section>
    } @else {
      <section class="tarjeta form">
        <h2>Acceso de responsables</h2>
        <p class="ayuda">
          Solo los 3 capitanes y el entrenador pueden poner y cobrar multas. Hazlo <strong>una vez</strong> en tu móvil
          con el código de invitación y este quedará autorizado. El resto del equipo puede consultar sin entrar.
        </p>
        <p class="plazas">Plazas ocupadas: {{ store.responsables().length }} / {{ store.plazas() }}
          @if (ocupados().length) { <span>({{ ocupados().join(', ') }})</span> }
        </p>

        <label>¿Quién eres?
          <select [(ngModel)]="quien">
            <option value="" disabled>Elige…</option>
            <option value="__entrenador">🧢 Entrenador</option>
            @for (j of jugadores; track j.id) {
              <option [value]="j.apodo" [disabled]="ocupados().includes(j.apodo)">{{ j.apodo }} (capitán)</option>
            }
          </select>
        </label>
        @if (quien === '__entrenador') {
          <label>Nombre del entrenador
            <input type="text" [(ngModel)]="nombreEntrenador" maxlength="30" placeholder="Ej.: Míster" />
          </label>
        }
        <label>Código de invitación
          <input type="text" [(ngModel)]="codigo" autocapitalize="characters" autocomplete="off" placeholder="CDV-…" />
        </label>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button class="btn btn-primario" (click)="entrar()" [disabled]="enviando()">
          {{ enviando() ? 'Comprobando…' : 'Autorizar este móvil' }}
        </button>
      </section>
    }
  `,
})
export class AccesoPage {
  protected readonly store = inject(Store);
  private readonly router = inject(Router);
  protected readonly jugadores = JUGADORES;
  protected readonly ocupados = computed(() => this.store.responsables().map((r) => r.nombre));
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected quien = '';
  protected nombreEntrenador = '';
  protected codigo = '';

  protected async entrar(): Promise<void> {
    const esEntrenador = this.quien === '__entrenador';
    const nombre = esEntrenador ? this.nombreEntrenador.trim() || 'Míster' : this.quien;
    if (!nombre) return this.error.set('Elige quién eres');
    if (!this.codigo.trim()) return this.error.set('Introduce el código de invitación');
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.store.registrar(this.codigo, nombre, esEntrenador ? 'Entrenador' : 'Capitán');
      this.router.navigate(['/nueva']);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.enviando.set(false);
    }
  }

  protected async salir(): Promise<void> {
    if (!confirm('¿Quitar el acceso de responsable en este móvil?')) return;
    await this.store.salir();
    this.store.avisar('Acceso retirado de este móvil');
  }
}
