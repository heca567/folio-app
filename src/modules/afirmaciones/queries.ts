import type {
  Afirmacion,
  FiltrosAfirmaciones,
  OpcionesFiltroAfirmaciones,
  OrigenAfirmacion,
} from './types';

export function crearFiltrosIniciales(): FiltrosAfirmaciones {
  return {
    busqueda: '',
    tipo: '',
    origen: '',
    estado: '',
    tipoEvolucion: '',
  };
}

function normalizarParaBusqueda(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

export function extraerOpcionesFiltro(
  afirmaciones: readonly Afirmacion[]
): OpcionesFiltroAfirmaciones {
  const tipos = new Set<string>();
  const origenes = new Set<OrigenAfirmacion>();
  const estados = new Set<string>();
  const tiposEvolucion = new Set<string>();

  for (const afirmacion of afirmaciones) {
    tipos.add(afirmacion.tipo);
    origenes.add(afirmacion.origen);
    estados.add(afirmacion.estado);
    tiposEvolucion.add(afirmacion.evolucion.tipo);
  }

  return {
    tipos: [...tipos].sort((a, b) => a.localeCompare(b, 'es')),
    origenes: [...origenes].sort((a, b) => a.localeCompare(b, 'es')),
    estados: [...estados].sort((a, b) => a.localeCompare(b, 'es')),
    tiposEvolucion: [...tiposEvolucion].sort((a, b) => a.localeCompare(b, 'es')),
  };
}

export function filtrarAfirmaciones(
  afirmaciones: readonly Afirmacion[],
  filtros: FiltrosAfirmaciones
): readonly Afirmacion[] {
  const terminoExacto = filtros.busqueda.toLocaleLowerCase('es').trim();
  const terminoNormalizado = normalizarParaBusqueda(filtros.busqueda);

  return afirmaciones.filter((afirmacion) => {
    if (filtros.tipo && afirmacion.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.origen && afirmacion.origen !== filtros.origen) {
      return false;
    }

    if (filtros.estado && afirmacion.estado !== filtros.estado) {
      return false;
    }

    if (filtros.tipoEvolucion && afirmacion.evolucion.tipo !== filtros.tipoEvolucion) {
      return false;
    }

    if (terminoExacto.length > 0) {
      const idLower = afirmacion.id.toLocaleLowerCase('es');
      const textoLower = afirmacion.texto.toLocaleLowerCase('es');
      const coincideExacto =
        idLower.includes(terminoExacto) || textoLower.includes(terminoExacto);

      if (coincideExacto) {
        return true;
      }

      const idNorm = normalizarParaBusqueda(afirmacion.id);
      const textoNorm = normalizarParaBusqueda(afirmacion.texto);
      return idNorm.includes(terminoNormalizado) || textoNorm.includes(terminoNormalizado);
    }

    return true;
  });
}
