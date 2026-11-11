import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Jugador } from '../core/catalogo';

const PIELES = ['#f2c9a0', '#e0ac7e', '#c68b5e', '#9c6a43', '#f6d5b8', '#b57a4f'];
const PELOS = ['#1d1a17', '#3b2a1e', '#6b4a2b', '#a8743d', '#2b2b2b', '#d9b26a'];
const FONDOS = ['#fff4b8', '#ffe066', '#e9ecef', '#d3f0e0', '#dbe8ff', '#ffe0cc'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Avatar genérico por jugador (determinista). Si existe /avatars/<id>.png|webp
 * se puede sustituir más adelante por la versión personalizada.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" role="img" [attr.aria-label]="jugador().apodo">
      <defs>
        <clipPath [attr.id]="clip()"><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g [attr.clip-path]="'url(#' + clip() + ')'">
        <rect width="64" height="64" [attr.fill]="v().fondo" />
        <!-- camiseta -->
        <path d="M8 64 C10 50 18 45 32 45 C46 45 54 50 56 64 Z" fill="#ffd400" stroke="#111" stroke-width="1.5" />
        <path d="M24 46 L32 54 L40 46" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" />
        <path d="M26 56 L38 64 M38 56 L26 64" stroke="#111" stroke-width="2.4" stroke-linecap="round" />
        <!-- cuello y cabeza -->
        <rect x="27" y="36" width="10" height="10" rx="3" [attr.fill]="v().piel" />
        <ellipse cx="32" cy="27" rx="13" ry="14.5" [attr.fill]="v().piel" />
        <!-- pelo -->
        @switch (v().peinado) {
          @case (0) {
            <path d="M19 25 C18 13 26 10 32 10 C40 10 46 14 45 25 C42 18 36 17 32 17 C27 17 22 19 19 25 Z" [attr.fill]="v().pelo" />
          }
          @case (1) {
            <path d="M19 24 C17 12 25 8 33 9 C41 9 47 14 45 24 L42 18 L38 21 L34 16 L30 21 L26 16 L22 21 Z" [attr.fill]="v().pelo" />
          }
          @case (2) {
            <path d="M20 21 C22 13 28 11 32 11 C37 11 43 13 44 21 C40 19 24 19 20 21 Z" [attr.fill]="v().pelo" />
          }
          @case (3) {
            <path d="M18 28 C15 12 26 7 33 8 C42 9 48 15 46 28 C44 22 43 18 38 17 C33 20 26 20 22 17 C20 20 19 24 18 28 Z" [attr.fill]="v().pelo" />
          }
          @default {
            <circle cx="32" cy="13" r="2" [attr.fill]="v().pelo" opacity=".4" />
          }
        }
        @if (v().barba) {
          <path d="M20 30 C21 40 26 42 32 42 C38 42 43 40 44 30 C41 36 37 37 32 37 C27 37 23 36 20 30 Z" [attr.fill]="v().pelo" opacity=".85" />
        }
        <!-- cara -->
        <circle cx="27" cy="27" r="1.8" fill="#111" />
        <circle cx="37" cy="27" r="1.8" fill="#111" />
        <path [attr.d]="v().boca" fill="none" stroke="#111" stroke-width="1.6" stroke-linecap="round" />
        <circle cx="23.5" cy="32" r="2" fill="#ff7a7a" opacity=".25" />
        <circle cx="40.5" cy="32" r="2" fill="#ff7a7a" opacity=".25" />
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
    const h = hash(this.jugador().id);
    const bocas = ['M28 34 Q32 37 36 34', 'M28 34 L36 34', 'M28 33.5 Q32 38 36 33.5', 'M29 35 Q32 33 35 35'];
    return {
      piel: PIELES[h % PIELES.length],
      pelo: PELOS[(h >> 3) % PELOS.length],
      fondo: FONDOS[(h >> 6) % FONDOS.length],
      peinado: (h >> 9) % 5,
      barba: ((h >> 12) % 3) === 0,
      boca: bocas[(h >> 14) % bocas.length],
    };
  });
}
