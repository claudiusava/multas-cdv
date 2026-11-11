import { computed, inject, Injectable, signal } from '@angular/core';
import { Api, NuevaMulta, esDemo } from './api';
import { calcularBote, calcularRanking, Multa, porFechaDesc, Responsable } from './multas';

export interface Admin {
  token: string;
  nombre: string;
  rol: string;
}

const ADMIN_KEY = esDemo() ? 'cdv.demo.admin' : 'cdv.admin';

const VISTO_KEY = esDemo() ? 'cdv.demo.visto' : 'cdv.visto';

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

  constructor() {
    setInterval(() => this.ahora.set(Date.now()), 30_000);
    setInterval(() => document.visibilityState === 'visible' && this.cargar(true), 90_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.ahora.set(Date.now());
        this.cargar(true);
      }
    });
    this.cargar();
    this.comprobarAdmin();
  }

  async cargar(silencioso = false): Promise<void> {
    if (!silencioso) this.cargando.set(true);
    try {
      const d = await this.api.datos();
      this.multas.set(d.multas);
      this.responsables.set(d.responsables);
      this.plazas.set(d.plazas);
      this.libres.set(d.libres ?? []);
      this.error.set(null);
      this.cargadoUnaVez.set(true);
    } catch (e) {
      if (!silencioso || !this.cargadoUnaVez()) this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
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
    const r = await this.api.enviar<{ token: string; admin: { nombre: string; rol: string } }>({
      action: 'register',
      nombre,
      dispositivo: navigator.userAgent,
    });
    this.guardarAdmin({ token: r.token, ...r.admin });
    this.marcarVisto();
    this.avisar(`¡Hola ${r.admin.nombre}! Ya puedes poner multas desde este móvil.`);
    await this.cargar(true);
  }

  async salir(): Promise<void> {
    const a = this.admin();
    if (a) await this.api.enviar({ action: 'logout', token: a.token }).catch(() => undefined);
    this.guardarAdmin(null);
    await this.cargar(true);
  }

  async nuevaMulta(m: NuevaMulta): Promise<void> {
    await this.api.enviar({ action: 'add', token: this.token(), ...m });
    await this.cargar(true);
  }

  async marcarPagada(m: Multa, pagada: boolean): Promise<void> {
    // Optimista: la UI responde al instante.
    const antes = this.multas();
    this.multas.set(antes.map((x) => (x.id === m.id ? { ...x, pagada, fechaPago: pagada ? new Date().toISOString() : null } : x)));
    try {
      await this.api.enviar({ action: pagada ? 'pay' : 'unpay', token: this.token(), id: m.id });
      await this.cargar(true);
    } catch (e) {
      this.multas.set(antes);
      throw e;
    }
  }

  async borrar(m: Multa): Promise<void> {
    await this.api.enviar({ action: 'delete', token: this.token(), id: m.id });
    await this.cargar(true);
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
