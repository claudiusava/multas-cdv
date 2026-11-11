export interface Jugador {
  id: string;
  apodo: string;
  nombre: string;
}

export type Ambito = 'Entrenamientos' | 'Partidos' | 'Otros aspectos';

export interface Infraccion {
  id: string;
  ambito: Ambito;
  concepto: string;
  importe: number;
  /** Se multiplica por unidades (p. ej. 2 € por prenda). */
  porUnidad?: string;
  /** Sanción no económica que acompaña a la multa. */
  extra?: string;
  /** Importe libre. */
  libre?: boolean;
}

/** Plantilla 2026/27. Para cambiar un apodo, edita sólo `apodo` (nunca el id). */
export const JUGADORES: Jugador[] = [
  { id: 'diaz-nunez-rodrigo', apodo: 'Rodri', nombre: 'Rodrigo Díaz Núñez' },
  { id: 'el-moussaqui-samir', apodo: 'Samir', nombre: 'Samir El Moussaqui Houlbi' },
  { id: 'elissaoui-hicham', apodo: 'Hichi', nombre: 'Hicham Elissaoui Chetouan' },
  { id: 'fernandez-zubillaga-diego', apodo: 'Peli', nombre: 'Diego Fernández Zubillaga' },
  { id: 'fquihi-soufian', apodo: 'Sufi', nombre: 'Soufian Fquihi Aaniba' },
  { id: 'garcia-farraces-jorge', apodo: 'Culo', nombre: 'Jorge García Farraces' },
  { id: 'gomez-batanero-daniel', apodo: 'Batanero', nombre: 'Daniel Gómez Batanero' },
  { id: 'jimenez-duque-bruno', apodo: 'Bruno', nombre: 'Bruno Jiménez Duque' },
  { id: 'lopez-corona-alejandro', apodo: 'Alejandro', nombre: 'Alejandro López Corona Cedillo' },
  { id: 'lozano-fresno-javier', apodo: 'Lozano', nombre: 'Javier Lozano Fresno' },
  { id: 'macias-maganto-javier', apodo: 'Javi', nombre: 'Javier Macías Maganto' },
  { id: 'martin-lopez-jaime', apodo: 'Jaime', nombre: 'Jaime Martín López' },
  { id: 'navarro-cedillo-david', apodo: 'David', nombre: 'David Navarro Cedillo' },
  { id: 'parrilla-daniel', apodo: 'Dani', nombre: 'Daniel Parrilla Fernández Llamazares' },
  { id: 'pascual-adrian', apodo: 'Adri', nombre: 'Adrián Vicente Pascual Mendoza' },
  { id: 'pascual-hector', apodo: 'Héctor', nombre: 'Héctor Vicente Pascual Mendoza' },
  { id: 'pasero-ignacio', apodo: 'Pase', nombre: 'Ignacio Pasero García' },
  { id: 'perez-torrescusa-victor', apodo: 'Víctor', nombre: 'Víctor Pérez Torrescusa' },
  { id: 'reneo-jose-manuel', apodo: 'Josito', nombre: 'José Manuel Reneo Bascón' },
  { id: 'sanchez-martin-diego', apodo: 'Diego', nombre: 'Diego Sánchez Martín' },
  { id: 'sava-claudiu', apodo: 'Clau', nombre: 'Claudiu Sava' },
  { id: 'vazquez-sergio', apodo: 'Sergio', nombre: 'Sergio Vázquez Jiménez' },
  { id: 'velasco-carrero-iker', apodo: 'Iker', nombre: 'Iker Velasco Carrero' },
  { id: 'velasco-sanchez-alvaro', apodo: 'Álvaro', nombre: 'Álvaro Velasco Sánchez' },
];

/** Régimen interno 2026/27. */
export const INFRACCIONES: Infraccion[] = [
  { id: 'ent-no-avisar', ambito: 'Entrenamientos', concepto: 'No venir al entreno y no avisar', importe: 5, extra: 'Motivo de no convocatoria' },
  { id: 'ent-tarde', ambito: 'Entrenamientos', concepto: 'Llegar tarde al entreno', importe: 2 },
  { id: 'ent-tarde-sin-avisar', ambito: 'Entrenamientos', concepto: 'Llegar tarde al entreno sin avisar', importe: 4 },
  { id: 'ent-chanclas', ambito: 'Entrenamientos', concepto: 'Acudir en chanclas o zuecos', importe: 2 },
  { id: 'par-tarde', ambito: 'Partidos', concepto: 'Llegar tarde al partido', importe: 2 },
  { id: 'par-tarde-sin-avisar', ambito: 'Partidos', concepto: 'Llegar tarde al partido sin avisar', importe: 4, extra: 'Si supera los 10′: posibilidad de no jugar y salir de convocatoria' },
  { id: 'par-no-acudir', ambito: 'Partidos', concepto: 'No acudir al partido y no avisar (convocado)', importe: 0, extra: 'Fuera de convocatoria el siguiente partido' },
  { id: 'par-vestimenta', ambito: 'Partidos', concepto: 'No acudir con la vestimenta estipulada', importe: 2, porUnidad: 'prenda' },
  { id: 'par-respeto', ambito: 'Partidos', concepto: 'Faltar al respeto a rivales, CT rival, árbitros, grada o mantenimiento', importe: 10, extra: 'Sanción disciplinaria a decidir por el CT' },
  { id: 'par-amarilla', ambito: 'Partidos', concepto: 'Tarjeta amarilla por hablar', importe: 5 },
  { id: 'par-roja', ambito: 'Partidos', concepto: 'Tarjeta roja por hablar', importe: 15 },
  { id: 'otr-respeto-equipo', ambito: 'Otros aspectos', concepto: 'Falta de respeto a compañeros o CT', importe: 5, extra: 'Sanción disciplinaria a contemplar por el CT' },
  { id: 'otr-respeto-club', ambito: 'Otros aspectos', concepto: 'Desobedecer o faltar al respeto a compañero del club o CT distinto', importe: 5, extra: 'Sanción disciplinaria a contemplar por el CT' },
  { id: 'otra', ambito: 'Otros aspectos', concepto: 'Otra sanción', importe: 0, libre: true },
];

export const AMBITOS: Ambito[] = ['Entrenamientos', 'Partidos', 'Otros aspectos'];

export const PLAZO_DIAS = 10;

export const NORMAS_SIN_MULTA = [
  'Hay que acudir al entreno con la indumentaria adecuada; si no, no se podrá participar.',
  'Se debe avisar siempre de la falta de asistencia.',
  'Cualquier problema o inquietud, comunicarlo al CT lo antes posible.',
  'Mostrar siempre respeto al equipo rival, jugadores, CT rival y árbitro.',
];

const POR_ID = new Map(JUGADORES.map((j) => [j.id, j]));
export function jugador(id: string): Jugador {
  return POR_ID.get(id) ?? { id, apodo: id, nombre: id };
}

export function infraccion(id: string): Infraccion | undefined {
  return INFRACCIONES.find((i) => i.id === id);
}
