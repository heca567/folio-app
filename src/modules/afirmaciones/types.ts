export type OrigenAfirmacion = 'usuario' | 'asistente';

export interface EvolucionAfirmacion {
  readonly tipo: string;
  readonly antecedentes: readonly string[];
}

export interface Afirmacion {
  readonly id: string;
  readonly texto: string;
  readonly tipo: string;
  readonly origen: OrigenAfirmacion;
  readonly estado: string;
  readonly fuentes: readonly string[];
  readonly evolucion: EvolucionAfirmacion;
}

export interface DocumentoAfirmaciones {
  readonly afirmaciones: readonly Afirmacion[];
}

export interface FiltrosAfirmaciones {
  readonly busqueda: string;
  readonly tipo: string;
  readonly origen: string;
  readonly estado: string;
  readonly tipoEvolucion: string;
}

export interface OpcionesFiltroAfirmaciones {
  readonly tipos: readonly string[];
  readonly origenes: readonly OrigenAfirmacion[];
  readonly estados: readonly string[];
  readonly tiposEvolucion: readonly string[];
}

export interface RelacionesAfirmacion {
  readonly antecedentes: readonly Afirmacion[];
  readonly antecedentesFaltantes: readonly string[];
  readonly sucesoras: readonly Afirmacion[];
}

export type ResultadoValidacion =
  | {
      readonly ok: true;
      readonly afirmaciones: readonly Afirmacion[];
    }
  | {
      readonly ok: false;
      readonly errores: readonly string[];
    };
