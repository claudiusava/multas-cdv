import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AMBITOS, INFRACCIONES, NORMAS_SIN_MULTA, PLAZO_DIAS } from '../core/catalogo';
import { euros } from '../core/multas';

@Component({
  selector: 'app-reglamento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="tarjeta">
      <h2>📜 Régimen interno 2026/27</h2>
      <p class="ayuda">
        Firmado por jugadores y cuerpo técnico, que se comprometen a cumplirlo. Se pueden añadir normas si es necesario.
      </p>
    </section>

    @for (a of ambitos; track a) {
      <h3 class="subtitulo">{{ a }}</h3>
      <ul class="tabla-multas">
        @for (i of porAmbito(a); track i.id) {
          <li>
            <span>
              {{ i.concepto }}
              @if (i.extra) { <small>+ {{ i.extra }}</small> }
            </span>
            <strong>{{ i.libre ? '—' : i.importe ? euros(i.importe) + (i.porUnidad ? ' / ' + i.porUnidad : '') : 'Sanción' }}</strong>
          </li>
        }
      </ul>
    }

    <h3 class="subtitulo">Normas generales</h3>
    <ul class="normas">
      @for (n of normas; track n) { <li>{{ n }}</li> }
    </ul>

    <section class="tarjeta notas">
      <p>🐷 El dinero de las multas se recoge en una hucha y tendrá un fin para el equipo.</p>
      <p>🧾 La recaudación la gestionan los capitanes.</p>
      <p>⏳ Plazo máximo de pago: <strong>{{ plazo }} días</strong> desde su comunicación.</p>
    </section>
  `,
})
export class ReglamentoPage {
  protected readonly ambitos = AMBITOS;
  protected readonly normas = NORMAS_SIN_MULTA;
  protected readonly plazo = PLAZO_DIAS;
  protected readonly euros = euros;
  protected porAmbito(a: string) {
    return INFRACCIONES.filter((i) => i.ambito === a && !i.libre);
  }
}
