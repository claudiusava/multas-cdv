import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from './core/store';
import { QuienEres } from './shared/quien-eres';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, QuienEres],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(Store);

  /** Primera apertura en este móvil y aún quedan plazas de responsable libres. */
  protected readonly preguntarQuien = computed(
    () => !this.store.esAdmin() && !this.store.visto() && this.store.cargadoUnaVez() && this.store.libres().length > 0,
  );
}
