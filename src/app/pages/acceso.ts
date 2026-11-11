import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '../core/store';
import { QuienEres } from '../shared/quien-eres';

/** Ruta oculta (#/acceso): ver o quitar el acceso de este móvil, o reclamar una plaza libre. */
@Component({
  selector: 'app-acceso',
  imports: [QuienEres],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.admin(); as a) {
      <section class="tarjeta centro">
        <p class="grande">{{ a.rol === 'Entrenador' ? '🧢' : '🛡️' }}</p>
        <h2>{{ a.nombre }} ({{ a.rol }})</h2>
        <p class="ayuda">Este móvil puede poner y cobrar multas.</p>
        <button class="btn btn-ghost peligro" (click)="salir()">Quitar acceso de este móvil</button>
        <small class="ayuda">Libera tu plaza para poder autorizar otro móvil.</small>
      </section>
    } @else {
      <app-quien-eres (hecho)="router.navigate(['/'])" />
    }
  `,
})
export class AccesoPage {
  protected readonly store = inject(Store);
  protected readonly router = inject(Router);

  protected async salir(): Promise<void> {
    if (!confirm('¿Quitar el acceso de responsable en este móvil?')) return;
    await this.store.salir();
    this.store.avisar('Acceso retirado de este móvil');
  }
}
