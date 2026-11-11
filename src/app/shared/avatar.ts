import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Jugador } from '../core/catalogo';

type Piel = 'blanco' | 'clarito' | 'tostado' | 'marroqui';
type Peinado = 'corto' | 'tupe' | 'flequillo' | 'pinchos' | 'raya' | 'poco' | 'rizado';
type ColorPelo = 'moreno' | 'negro' | 'castano' | 'rubio' | 'platino' | 'pelirrojo';
type Barba = 'no' | 'barba' | 'perilla';

interface Rasgos {
  piel: Piel;
  peinado: Peinado;
  pelo: ColorPelo;
  barba?: Barba;
  pecas?: boolean;
}

const PIELES: Record<Piel, string> = {
  blanco: '#f7d7bd',
  clarito: '#ecc09a',
  tostado: '#d9a47a',
  marroqui: '#c58b5f',
};

const PELOS: Record<ColorPelo, string> = {
  moreno: '#2e1f16',
  negro: '#171310',
  castano: '#6a4528',
  rubio: '#dcb04c',
  platino: '#f2e4a6',
  pelirrojo: '#c4572a',
};

/** Descripciones del vestuario (noviembre 2026). */
const RASGOS: Record<string, Rasgos> = {
  'pascual-adrian': { piel: 'blanco', peinado: 'flequillo', pelo: 'moreno' },
  'pascual-hector': { piel: 'blanco', peinado: 'flequillo', pelo: 'moreno' }, // gemelo de Adri
  'lopez-corona-alejandro': { piel: 'blanco', peinado: 'corto', pelo: 'rubio' },
  'velasco-sanchez-alvaro': { piel: 'clarito', peinado: 'tupe', pelo: 'moreno' },
  'gomez-batanero-daniel': { piel: 'blanco', peinado: 'poco', pelo: 'platino' },
  'jimenez-duque-bruno': { piel: 'blanco', peinado: 'tupe', pelo: 'moreno' },
  'lozano-fresno-javier': { piel: 'blanco', peinado: 'raya', pelo: 'rubio' },
  'sava-claudiu': { piel: 'blanco', peinado: 'corto', pelo: 'moreno', barba: 'barba' },
  'navarro-cedillo-david': { piel: 'blanco', peinado: 'corto', pelo: 'moreno' },
  'sanchez-martin-diego': { piel: 'tostado', peinado: 'pinchos', pelo: 'moreno' },
  'elissaoui-hicham': { piel: 'marroqui', peinado: 'poco', pelo: 'negro' },
  'velasco-carrero-iker': { piel: 'blanco', peinado: 'flequillo', pelo: 'moreno' },
  'martin-lopez-jaime': { piel: 'blanco', peinado: 'raya', pelo: 'moreno' },
  'macias-maganto-javier': { piel: 'clarito', peinado: 'corto', pelo: 'moreno' },
  'garcia-farraces-jorge': { piel: 'blanco', peinado: 'pinchos', pelo: 'moreno' },
  'reneo-jose-manuel': { piel: 'blanco', peinado: 'tupe', pelo: 'moreno' },
  'parrilla-daniel': { piel: 'blanco', peinado: 'flequillo', pelo: 'negro' },
  'pasero-ignacio': { piel: 'blanco', peinado: 'corto', pelo: 'moreno', barba: 'barba' },
  'fernandez-zubillaga-diego': { piel: 'blanco', peinado: 'rizado', pelo: 'pelirrojo', pecas: true },
  'diaz-nunez-rodrigo': { piel: 'blanco', peinado: 'corto', pelo: 'moreno' },
  'el-moussaqui-samir': { piel: 'marroqui', peinado: 'corto', pelo: 'negro' },
  'vazquez-sergio': { piel: 'blanco', peinado: 'tupe', pelo: 'negro' },
  'fquihi-soufian': { piel: 'marroqui', peinado: 'pinchos', pelo: 'negro', barba: 'perilla' },
  'perez-torrescusa-victor': { piel: 'blanco', peinado: 'corto', pelo: 'castano' },
  gabi: { piel: 'blanco', peinado: 'rizado', pelo: 'moreno', barba: 'barba' }, // entrenador
};

const PEINADOS: Record<Exclude<Peinado, 'rizado'>, string> = {
  corto: 'M19 25 C18 13 26 10 32 10 C40 10 46 14 45 25 C42 18 36 17 32 17 C27 17 22 19 19 25 Z',
  tupe: 'M19 25 C17 12 24 5 33 5.5 C42 6 47 13 45 25 C43 18 39 16 35 16 C30 13 23 17 19 25 Z',
  flequillo:
    'M18.5 26 C16 12 25 8 32 8 C40 8 48 12 45.5 26 C45 21 43.5 19 42 19 L39 22 L36 18 L32 22 L28 18 L24.5 22 C22 21 19.5 23 18.5 26 Z',
  pinchos: 'M19 24 C17 12 25 8 33 9 C41 9 47 14 45 24 L42 17 L38 20 L35 13 L31 19 L27 13 L24 19 L21 16 Z',
  raya: 'M19 25 C18 13 25 9 33 9 C41 9 46 14 45 25 C44 19 42 16 37 15 C33 18 25 18 19 25 Z',
  poco: 'M20 21 C22 14 27.5 12 32 12 C36.5 12 42 14 44 21 C40 18.5 24 18.5 20 21 Z',
};

const FONDOS = ['#fff4b8', '#ffe066', '#e9ecef', '#d3f0e0', '#dbe8ff', '#ffe0cc'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Avatar de cada jugador: camiseta del club y rasgos según su descripción. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let a = v();
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" role="img" [attr.aria-label]="jugador().apodo">
      <defs>
        <clipPath [attr.id]="clip()"><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g [attr.clip-path]="'url(#' + clip() + ')'">
        <rect width="64" height="64" [attr.fill]="a.fondo" />
        <!-- camiseta -->
        <path d="M8 64 C10 50 18 45 32 45 C46 45 54 50 56 64 Z" fill="#ffd400" stroke="#111" stroke-width="1.5" />
        <path d="M24 46 L32 54 L40 46" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" />
        <path d="M26 56 L38 64 M38 56 L26 64" stroke="#111" stroke-width="2.4" stroke-linecap="round" />
        <!-- cuello, orejas y cabeza -->
        <rect x="27" y="36" width="10" height="10" rx="3" [attr.fill]="a.piel" />
        <ellipse cx="19" cy="28" rx="2.6" ry="3.6" [attr.fill]="a.piel" />
        <ellipse cx="45" cy="28" rx="2.6" ry="3.6" [attr.fill]="a.piel" />
        <ellipse cx="32" cy="27" rx="13" ry="14.5" [attr.fill]="a.piel" />
        <!-- pelo -->
        @if (a.rizado) {
          <g [attr.fill]="a.pelo">
            <circle cx="20.5" cy="21" r="4.6" /><circle cx="43.5" cy="21" r="4.6" />
            <circle cx="24" cy="15" r="5.2" /><circle cx="40" cy="15" r="5.2" />
            <circle cx="32" cy="11.5" r="6" /><circle cx="27.5" cy="12.5" r="4.5" /><circle cx="36.5" cy="12.5" r="4.5" />
            <circle cx="24" cy="19.5" r="3.6" /><circle cx="40" cy="19.5" r="3.6" /><circle cx="32" cy="17" r="3.8" />
          </g>
        } @else {
          <path [attr.d]="a.peinado" [attr.fill]="a.pelo" />
        }
        <!-- barba -->
        @if (a.barba === 'barba') {
          <path d="M19.5 28 C19.5 40 25.5 43.5 32 43.5 C38.5 43.5 44.5 40 44.5 28 C42.5 34.5 38.5 36.5 32 36.5 C25.5 36.5 21.5 34.5 19.5 28 Z" [attr.fill]="a.pelo" />
          <path d="M26.5 33.8 Q32 31 37.5 33.8 Q32 35.3 26.5 33.8 Z" [attr.fill]="a.pelo" />
        } @else if (a.barba === 'perilla') {
          <path d="M28.5 37.6 Q32 43.5 35.5 37.6 Q32 39.2 28.5 37.6 Z" [attr.fill]="a.pelo" />
          <path d="M28 33.6 Q32 32 36 33.6" fill="none" [attr.stroke]="a.pelo" stroke-width="1.4" stroke-linecap="round" />
        }
        <!-- cara -->
        <path d="M24.5 23.2 L29 22.4 M35 22.4 L39.5 23.2" [attr.stroke]="a.ceja" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="27" cy="27" r="1.8" fill="#111" />
        <circle cx="37" cy="27" r="1.8" fill="#111" />
        <path d="M32 28.5 Q30.8 31.5 32.6 31.6" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.2" stroke-linecap="round" />
        <path [attr.d]="a.boca" fill="none" [attr.stroke]="a.barba === 'barba' ? '#f1d0c0' : '#111'" stroke-width="1.6" stroke-linecap="round" />
        @if (a.pecas) {
          <g fill="#b5562e" opacity=".55">
            <circle cx="24.5" cy="31" r=".7" /><circle cx="26.5" cy="32.2" r=".7" /><circle cx="23.5" cy="33" r=".7" />
            <circle cx="39.5" cy="31" r=".7" /><circle cx="37.5" cy="32.2" r=".7" /><circle cx="40.5" cy="33" r=".7" />
          </g>
        } @else {
          <circle cx="23.5" cy="32" r="2" fill="#ff7a7a" opacity=".22" />
          <circle cx="40.5" cy="32" r="2" fill="#ff7a7a" opacity=".22" />
        }
      </g>
    </svg>
  `,
  styles: `
    :host { display: inline-flex; border-radius: 50%; box-shadow: 0 0 0 2px var(--avatar-ring, #111); line-height: 0; flex: none; }
  `,
})
export class Avatar {
  readonly jugador = input.required<Jugador>();
  readonly size = input(44);

  protected readonly clip = computed(() => 'av-' + this.jugador().id);
  protected readonly v = computed(() => {
    const id = this.jugador().id;
    const h = hash(id);
    const r: Rasgos = RASGOS[id] ?? { piel: 'blanco', peinado: 'corto', pelo: 'castano' };
    const bocas = ['M28 34 Q32 37 36 34', 'M28.5 34.2 Q32 36 35.5 34.2', 'M28 33.5 Q32 38 36 33.5', 'M28.5 34.5 Q32 36.5 35.5 34'];
    const pelo = PELOS[r.pelo];
    return {
      piel: PIELES[r.piel],
      pelo,
      ceja: r.pelo === 'platino' || r.pelo === 'rubio' ? '#a07a2e' : pelo,
      peinado: r.peinado === 'rizado' ? '' : PEINADOS[r.peinado],
      rizado: r.peinado === 'rizado',
      barba: r.barba ?? 'no',
      pecas: !!r.pecas,
      fondo: FONDOS[(h >>> 6) % FONDOS.length],
      boca: bocas[(h >>> 14) % bocas.length],
    };
  });
}
