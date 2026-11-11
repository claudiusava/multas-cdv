import { Injectable } from '@angular/core';
import { JUGADORES } from './catalogo';
import { Multa, Responsable } from './multas';

/** URL del despliegue web de Apps Script (hoja "Multas CDV" en Drive). */
export const API_URL =
  'https://script.google.com/macros/s/AKfycbzyroKGoNtF7n_eJGdVu824Ai0IHXXmlB9jnMNQfRmXlYCNj2uw0kK5sPO1izjOPrcCAQ/exec';

export interface Datos {
  multas: Multa[];
  responsables: Responsable[];
  plazas: number;
}

export interface NuevaMulta {
  jugadorId: string;
  jugador: string;
  infraccionId: string;
  concepto: string;
  importe: number;
  nota: string;
}

type Accion =
  | { action: 'register'; code: string; nombre: string; rol: string; dispositivo: string }
  | { action: 'whoami'; token: string }
  | ({ action: 'add'; token: string } & NuevaMulta)
  | { action: 'pay' | 'unpay' | 'delete'; token: string; id: string }
  | { action: 'logout'; token: string };

/** Modo demo: datos de prueba en este navegador (?demo=1 / ?demo=0). */
export function esDemo(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('demo') ?? new URLSearchParams(location.hash.split('?')[1] ?? '').get('demo');
    if (q !== null) localStorage.setItem('cdv.demo', q === '0' ? '0' : '1');
    return localStorage.getItem('cdv.demo') === '1';
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class Api {
  readonly demo = esDemo();

  async datos(): Promise<Datos> {
    if (this.demo) return demoDatos();
    const res = await fetch(`${API_URL}?t=${Date.now()}`, { redirect: 'follow' });
    return this.leer<Datos>(res);
  }

  async enviar<T = Record<string, unknown>>(body: Accion): Promise<T> {
    if (this.demo) return demoEnviar(body) as T;
    const res = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    return this.leer<T>(res);
  }

  private async leer<T>(res: Response): Promise<T> {
    let json: { ok: boolean; error?: string } & T;
    try {
      json = await res.json();
    } catch {
      throw new Error('El servidor no responde. Inténtalo en un momento.');
    }
    if (!json.ok) throw new Error(json.error || 'Error desconocido');
    return json;
  }
}

// ---------------- modo demo ----------------

const DEMO_KEY = 'cdv.demo.datos';

function demoDatos(): Datos {
  const raw = localStorage.getItem(DEMO_KEY);
  if (raw) return JSON.parse(raw);
  const d = 86_400_000;
  const now = Date.now();
  const mk = (i: number, jugadorId: string, infraccionId: string, concepto: string, importe: number, hace: number, pagada = false): Multa => ({
    id: 'demo-' + i,
    fecha: new Date(now - hace * d).toISOString(),
    jugadorId,
    infraccionId,
    concepto,
    importe,
    nota: '',
    creadaPor: 'Clau',
    pagada,
    fechaPago: pagada ? new Date(now - (hace - 2) * d).toISOString() : null,
    cobradaPor: pagada ? 'Clau' : '',
  });
  const datos: Datos = {
    multas: [
      mk(1, 'diaz-nunez-rodrigo', 'par-roja', 'Tarjeta roja por hablar', 15, 3),
      mk(2, 'garcia-farraces-jorge', 'ent-tarde-sin-avisar', 'Llegar tarde al entreno sin avisar', 4, 12),
      mk(3, 'pasero-ignacio', 'par-amarilla', 'Tarjeta amarilla por hablar', 5, 1),
      mk(4, 'garcia-farraces-jorge', 'ent-chanclas', 'Acudir en chanclas o zuecos', 2, 20, true),
      mk(5, 'reneo-jose-manuel', 'ent-tarde', 'Llegar tarde al entreno', 2, 6, true),
      mk(6, 'el-moussaqui-samir', 'par-vestimenta', 'No acudir con la vestimenta estipulada (×2 prendas)', 4, 0.2),
    ],
    responsables: [{ nombre: 'Clau', rol: 'Capitán' }],
    plazas: 4,
  };
  localStorage.setItem(DEMO_KEY, JSON.stringify(datos));
  return datos;
}

function demoEnviar(b: Accion): Record<string, unknown> {
  const datos = demoDatos();
  const guardar = () => localStorage.setItem(DEMO_KEY, JSON.stringify(datos));
  const yo = () => {
    const a = JSON.parse(localStorage.getItem('cdv.demo.admin') || 'null');
    if (!a) throw new Error('No autorizado');
    return a.nombre as string;
  };
  switch (b.action) {
    case 'register': {
      if (b.code.trim().toUpperCase() !== 'CDV-DEMO') throw new Error('Código incorrecto (en demo es CDV-DEMO)');
      datos.responsables = datos.responsables.filter((r) => r.nombre !== b.nombre);
      datos.responsables.push({ nombre: b.nombre, rol: b.rol });
      guardar();
      return { token: 'demo', admin: { nombre: b.nombre, rol: b.rol } };
    }
    case 'whoami':
      return { admin: { nombre: yo() } };
    case 'add': {
      const j = JUGADORES.find((x) => x.id === b.jugadorId);
      datos.multas.push({
        id: 'demo-' + Date.now(),
        fecha: new Date().toISOString(),
        jugadorId: b.jugadorId,
        infraccionId: b.infraccionId,
        concepto: b.concepto,
        importe: b.importe,
        nota: b.nota,
        creadaPor: yo(),
        pagada: false,
        fechaPago: null,
        cobradaPor: '',
      });
      guardar();
      return { id: j?.id };
    }
    case 'pay':
    case 'unpay': {
      const m = datos.multas.find((x) => x.id === b.id);
      if (m) {
        m.pagada = b.action === 'pay';
        m.fechaPago = m.pagada ? new Date().toISOString() : null;
        m.cobradaPor = m.pagada ? yo() : '';
      }
      guardar();
      return {};
    }
    case 'delete':
      datos.multas = datos.multas.filter((x) => x.id !== b.id);
      guardar();
      return {};
    case 'logout':
      return {};
  }
}
