import { calcularBote, calcularRanking, cuentaAtras, estaVencida, Multa, ordenarListado } from './multas';

const DIA = 86_400_000;
const ahora = Date.parse('2026-11-20T12:00:00Z');

function multa(p: Partial<Multa>): Multa {
  return {
    id: Math.random().toString(),
    fecha: new Date(ahora - DIA).toISOString(),
    jugadorId: 'sava-claudiu',
    infraccionId: 'ent-tarde',
    concepto: 'Llegar tarde',
    importe: 2,
    nota: '',
    creadaPor: 'Clau',
    pagada: false,
    fechaPago: null,
    cobradaPor: '',
    ...p,
  };
}

describe('multas', () => {
  it('vence a los 10 días', () => {
    expect(estaVencida(multa({ fecha: new Date(ahora - 9 * DIA).toISOString() }), ahora)).toBe(false);
    expect(estaVencida(multa({ fecha: new Date(ahora - 10 * DIA).toISOString() }), ahora)).toBe(true);
    expect(estaVencida(multa({ fecha: new Date(ahora - 30 * DIA).toISOString(), pagada: true }), ahora)).toBe(false);
  });

  it('formatea la cuenta atrás', () => {
    expect(cuentaAtras(3 * DIA + 5 * 3_600_000)).toBe('3 d 5 h');
    expect(cuentaAtras(-2 * DIA)).toBe('Vencida hace 2 d');
  });

  it('calcula el bote', () => {
    const b = calcularBote([multa({ importe: 5, pagada: true }), multa({ importe: 4 }), multa({ importe: 2 })], ahora);
    expect(b).toEqual({ recaudado: 5, pendiente: 6, total: 11, numPendientes: 2, numVencidas: 0 });
  });

  it('ordena el listado: vencidas, luego menos plazo, pagadas al final', () => {
    const pagada = multa({ id: 'p', pagada: true, fecha: new Date(ahora - 20 * DIA).toISOString() });
    const nueva = multa({ id: 'n', fecha: new Date(ahora - 1 * DIA).toISOString() });
    const vencida = multa({ id: 'v', fecha: new Date(ahora - 12 * DIA).toISOString() });
    const casi = multa({ id: 'c', fecha: new Date(ahora - 8 * DIA).toISOString() });
    expect(ordenarListado([pagada, nueva, casi, vencida]).map((m) => m.id)).toEqual(['v', 'c', 'n', 'p']);
  });

  it('ordena el ranking por total y comparte posición en empates', () => {
    const r = calcularRanking(
      [multa({ jugadorId: 'diaz-nunez-rodrigo', importe: 15 }), multa({ importe: 5 }), multa({ jugadorId: 'vazquez-sergio', importe: 5 })],
      ahora,
    );
    expect(r[0].jugador.apodo).toBe('Rodri');
    expect(r[1].posicion).toBe(2);
    expect(r[2].posicion).toBe(2);
    expect(r[3].total).toBe(0);
  });
});
