import { JUGADORES, Jugador, PLAZO_DIAS } from './catalogo';

export interface Multa {
  id: string;
  fecha: string;
  jugadorId: string;
  infraccionId: string;
  concepto: string;
  importe: number;
  nota: string;
  creadaPor: string;
  pagada: boolean;
  fechaPago: string | null;
  cobradaPor: string;
}

export interface Responsable {
  nombre: string;
  rol: string;
}

export interface FilaRanking {
  jugador: Jugador;
  total: number;
  pendiente: number;
  pagado: number;
  numMultas: number;
  vencidas: number;
  posicion: number;
}

export interface Bote {
  recaudado: number;
  pendiente: number;
  total: number;
  numPendientes: number;
  numVencidas: number;
}

const DIA = 24 * 60 * 60 * 1000;

export function vencimiento(m: Pick<Multa, 'fecha'>): Date {
  return new Date(new Date(m.fecha).getTime() + PLAZO_DIAS * DIA);
}

export function msRestantes(m: Pick<Multa, 'fecha'>, ahora: number): number {
  return vencimiento(m).getTime() - ahora;
}

export function estaVencida(m: Multa, ahora: number): boolean {
  return !m.pagada && m.importe > 0 && msRestantes(m, ahora) <= 0;
}

export function cuentaAtras(ms: number): string {
  if (ms <= 0) {
    const dias = Math.floor(-ms / DIA);
    return dias === 0 ? 'Vencida hoy' : `Vencida hace ${dias} d`;
  }
  const d = Math.floor(ms / DIA);
  const h = Math.floor((ms % DIA) / 3_600_000);
  const min = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${min} min`;
  return `${Math.max(min, 1)} min`;
}

export function porFechaDesc(a: Multa, b: Multa): number {
  return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
}

/**
 * Listado único: primero las no pagadas por fecha límite (vencidas arriba,
 * luego la que menos tiempo le queda), después sanciones sin importe y al
 * final las pagadas (más recientes primero).
 */
export function ordenarListado(multas: Multa[]): Multa[] {
  const grupo = (m: Multa) => (m.pagada ? 2 : m.importe === 0 ? 1 : 0);
  return [...multas].sort((a, b) => {
    const g = grupo(a) - grupo(b);
    if (g) return g;
    if (grupo(a) === 0) return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    if (grupo(a) === 2) return new Date(b.fechaPago ?? b.fecha).getTime() - new Date(a.fechaPago ?? a.fecha).getTime();
    return porFechaDesc(a, b);
  });
}

export function calcularBote(multas: Multa[], ahora: number): Bote {
  let recaudado = 0;
  let pendiente = 0;
  let numPendientes = 0;
  let numVencidas = 0;
  for (const m of multas) {
    if (m.pagada) recaudado += m.importe;
    else if (m.importe > 0) {
      pendiente += m.importe;
      numPendientes++;
      if (estaVencida(m, ahora)) numVencidas++;
    }
  }
  return { recaudado, pendiente, total: recaudado + pendiente, numPendientes, numVencidas };
}

/** Ranking por importe total acumulado (pagado + pendiente). Empates: más multas primero. */
export function calcularRanking(multas: Multa[], ahora: number, jugadores = JUGADORES): FilaRanking[] {
  const filas = new Map<string, FilaRanking>(
    jugadores.map((j) => [j.id, { jugador: j, total: 0, pendiente: 0, pagado: 0, numMultas: 0, vencidas: 0, posicion: 0 }]),
  );
  for (const m of multas) {
    const f = filas.get(m.jugadorId);
    if (!f) continue;
    f.total += m.importe;
    f.numMultas++;
    if (m.pagada) f.pagado += m.importe;
    else f.pendiente += m.importe;
    if (estaVencida(m, ahora)) f.vencidas++;
  }
  const lista = [...filas.values()].sort(
    (a, b) => b.total - a.total || b.numMultas - a.numMultas || a.jugador.apodo.localeCompare(b.jugador.apodo, 'es'),
  );
  let pos = 0;
  let prev: FilaRanking | null = null;
  lista.forEach((f, i) => {
    if (!prev || prev.total !== f.total || prev.numMultas !== f.numMultas) pos = i + 1;
    f.posicion = pos;
    prev = f;
  });
  return lista;
}

export function euros(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 ? 2 : 0 });
}
