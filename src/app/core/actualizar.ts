/**
 * Cada publicación genera un main-XXXX.js con otro nombre. Si el index.html
 * publicado apunta a uno distinto del que está corriendo, hay versión nueva.
 */
const PATRON = /main-[A-Za-z0-9]+\.js/;

function versionActual(): string | null {
  const s = [...document.scripts].map((x) => x.src.match(PATRON)?.[0]).find(Boolean);
  return s ?? null;
}

/** Devuelve el nombre del main.js publicado si es distinto del que está corriendo. */
export async function versionNueva(): Promise<string | null> {
  const actual = versionActual();
  if (!actual) return null; // ng serve: sin hash, no aplica
  try {
    const r = await fetch(`./index.html?v=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const publicada = (await r.text()).match(PATRON)?.[0];
    return publicada && publicada !== actual ? publicada : null;
  } catch {
    return null;
  }
}
