import { computed, inject, Injectable, signal } from '@angular/core';
import { Api, Datos, NuevaMulta, esDemo } from './api';
import { calcularBote, calcularRanking, Multa, porFechaDesc, Responsable } from './multas';

export interface Admin {
  token: string;
  nombre: string;
  rol: string;
}

const ADMIN_KEY = esDemo() ? 'cdv.demo.admin' : 'cdv.admin';

const VISTO_KEY = esDemo() ? 'cdv.demo.visto' : 'cdv.visto';
/** Últimos datos recibidos: la app arranca con ellos al instante y luego refresca. */
const CACHE_KEY = esDemo() ? 'cdv.demo.cache' : 'cdv.cache.v1';

function leerCache(): Datos | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function leerVisto(): boolean {
  try {
    return localStorage.getItem(VISTO_KEY) === '1';
  } catch {
    return false;
  }
}

function leerAdmin(): Admin | null {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null');
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly api = inject(Api);

  readonly demo = this.api.demo;
  readonly multas = signal<Multa[]>([]);
  readonly responsables = signal<Responsable[]>([]);
  readonly plazas = signal(4);
  readonly libres = signal<string[]>([]);
  /** Este móvil ya pasó por la pantalla "¿Quién eres?". */
  readonly visto = signal(leerVisto());
  readonly cargando = signal(true);
  readonly cargadoUnaVez = signal(false);
  readonly error = signal<string | null>(null);
  readonly admin = signal<Admin | null>(leerAdmin());
  readonly ahora = signal(Date.now());
  readonly aviso = signal<string | null>(null);

  readonly esAdmin = computed(() => !!this.admin());
  readonly ordenadas = computed(() => [...this.multas()].sort(porFechaDesc));
  readonly pendientes = computed(() => this.ordenadas().filter((m) => !m.pagada && m.importe > 0));
  readonly pagadas = computed(() =>
    this.ordenadas().filter((m) => m.pagada || m.importe === 0),
  );
  readonly bote = computed(() => calcularBote(this.multas(), this.ahora()));
  readonly ranking = computed(() => calcularRanking(this.multas(), this.ahora()));

  private avisoTimer: ReturnType<typeof setTimeout> | undefined;
  /** Escrituras en vuelo y versión local: evita que una lectura antigua pise un cambio recién hecho. */
  private enVuelo = 0;
  private version = 0;

  constructor() {
    const cache = leerCache();
    if (cache) this.aplicar(cache, false);
    setInterval(() => this.ahora.set(Date.now()), 30_000);
    setInterval(() => document.visibilityState === 'visible' && this.cargar(true), 90_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.ahora.set(Date.now());
        this.cargar(true);
      }
    });
    this.cargar(!!cache);
    this.comprobarAdmin();
  }

  async cargar(silencioso = false): Promise<void> {
    if (!silencioso) this.cargando.set(true);
    const v = this.version;
    try {
      const d = await this.api.datos();
      if (this.enVuelo === 0 && v === this.version) this.aplicar(d);
      this.error.set(null);
    } catch (e) {
      if (!this.cargadoUnaVez()) this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }

  private aplicar(d: Datos, guardar = true): void {
    this.multas.set(d.multas);
    this.responsables.set(d.responsables);
    this.plazas.set(d.plazas);
    this.libres.set(d.libres ?? []);
    this.cargadoUnaVez.set(true);
    if (guardar) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ multas: d.multas, responsables: d.responsables, libres: d.libres, plazas: d.plazas }));
      } catch {
        /* sin almacenamiento */
      }
    }
  }

  /**
   * Cambio optimista: la pantalla se actualiza al instante, el servidor se
   * entera por detrás y su respuesta (con todos los datos) se aplica al final.
   * Si falla, se vuelve atrás y se avisa.
   */
  private async escribir(cambio: (m: Multa[]) => Multa[], peticion: () => Promise<{ datos?: Datos }>, error: string): Promise<boolean> {
    const antes = this.multas();
    this.version++;
    this.multas.set(cambio(antes));
    this.enVuelo++;
    try {
      const r = await peticion();
      this.enVuelo--;
      if (this.enVuelo === 0 && r.datos) this.aplicar(r.datos);
      return true;
    } catch (e) {
      this.enVuelo--;
      this.multas.set(antes);
      const msg = (e as Error).message;
      // Le han quitado la plaza en la hoja: este móvil deja de ser responsable.
      if (msg === 'No autorizado') this.guardarAdmin(null);
      this.avisar(msg === 'No autorizado' ? 'Este móvil ya no está autorizado como responsable' : `${error}: ${msg}`);
      if (this.enVuelo === 0) this.cargar(true);
      return false;
    }
  }

  /** Si un responsable ha sido dado de baja en la hoja, el móvil pierde el acceso. */
  private async comprobarAdmin(): Promise<void> {
    const a = this.admin();
    if (!a) return;
    try {
      await this.api.enviar({ action: 'whoami', token: a.token });
    } catch (e) {
      if ((e as Error).message === 'No autorizado') this.guardarAdmin(null);
    }
  }

  async registrar(nombre: string): Promise<void> {
    const r = await this.api.enviar<{ token: string; admin: { nombre: string; rol: string }; datos?: Datos }>({
      action: 'register',
      nombre,
      dispositivo: navigator.userAgent,
    });
    this.guardarAdmin({ token: r.token, ...r.admin });
    this.marcarVisto();
    this.avisar(`¡Hola ${r.admin.nombre}! Ya puedes poner multas desde este móvil.`);
    if (r.datos) this.aplicar(r.datos);
  }

  async salir(): Promise<void> {
    const a = this.admin();
    if (a) await this.api.enviar({ action: 'logout', token: a.token }).catch(() => undefined);
    this.guardarAdmin(null);
    await this.cargar(true);
  }

  /** Devuelve al momento; la multa aparece ya en la lista mientras se guarda. */
  nuevaMulta(m: NuevaMulta): Promise<boolean> {
    const token = this.token();
    const temporal: Multa = {
      id: 'tmp-' + Date.now(),
      fecha: new Date().toISOString(),
      jugadorId: m.jugadorId,
      infraccionId: m.infraccionId,
      concepto: m.concepto,
      importe: m.importe,
      nota: m.nota,
      creadaPor: this.admin()!.nombre,
      pagada: false,
      fechaPago: null,
      cobradaPor: '',
    };
    return this.escribir(
      (l) => [temporal, ...l],
      () => this.api.enviar({ action: 'add', token, ...m }),
      'No se pudo guardar la multa',
    );
  }

  marcarPagada(m: Multa, pagada: boolean): Promise<boolean> {
    const token = this.token();
    const nombre = this.admin()!.nombre;
    return this.escribir(
      (l) => l.map((x) => (x.id === m.id ? { ...x, pagada, fechaPago: pagada ? new Date().toISOString() : null, cobradaPor: pagada ? nombre : '' } : x)),
      () => this.api.enviar({ action: pagada ? 'pay' : 'unpay', token, id: m.id }),
      pagada ? 'No se pudo marcar como pagada' : 'No se pudo deshacer el pago',
    );
  }

  borrar(m: Multa): Promise<boolean> {
    const token = this.token();
    return this.escribir(
      (l) => l.filter((x) => x.id !== m.id),
      () => this.api.enviar({ action: 'delete', token, id: m.id }),
      'No se pudo borrar',
    );
  }

  marcarVisto(): void {
    this.visto.set(true);
    try {
      localStorage.setItem(VISTO_KEY, '1');
    } catch {
      /* almacenamiento no disponible */
    }
  }

  avisar(texto: string): void {
    this.aviso.set(texto);
    clearTimeout(this.avisoTimer);
    this.avisoTimer = setTimeout(() => this.aviso.set(null), 3500);
  }

  private token(): string {
    const a = this.admin();
    if (!a) throw new Error('Solo los capitanes y el entrenador pueden hacer esto');
    return a.token;
  }

  private guardarAdmin(a: Admin | null): void {
    this.admin.set(a);
    try {
      if (a) localStorage.setItem(ADMIN_KEY, JSON.stringify(a));
      else localStorage.removeItem(ADMIN_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
  }
}
