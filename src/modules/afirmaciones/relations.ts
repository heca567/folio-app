import type { Afirmacion, RelacionesAfirmacion } from './types';

export function resolverRelaciones(
  afirmacionId: string,
  afirmaciones: readonly Afirmacion[]
): RelacionesAfirmacion {
  const indicePorId = new Map<string, Afirmacion>();
  for (const item of afirmaciones) {
    indicePorId.set(item.id, item);
  }

  const objetivo = indicePorId.get(afirmacionId);
  if (!objetivo) {
    return {
      antecedentes: [],
      antecedentesFaltantes: [],
      sucesoras: [],
    };
  }

  const antecedentes: Afirmacion[] = [];
  const antecedentesFaltantes: string[] = [];
  const antecedentesVistos = new Set<string>();

  for (const antecedenteId of objetivo.evolucion.antecedentes) {
    if (antecedentesVistos.has(antecedenteId)) {
      continue;
    }
    antecedentesVistos.add(antecedenteId);

    const encontrada = indicePorId.get(antecedenteId);
    if (encontrada) {
      antecedentes.push(encontrada);
    } else {
      antecedentesFaltantes.push(antecedenteId);
    }
  }

  const sucesoras = afirmaciones.filter(
    (candidata) =>
      candidata.id !== objetivo.id &&
      candidata.evolucion.antecedentes.includes(objetivo.id)
  );

  return {
    antecedentes,
    antecedentesFaltantes,
    sucesoras,
  };
}
