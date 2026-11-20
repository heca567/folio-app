import type { Afirmacion, OrigenAfirmacion, ResultadoValidacion } from './types';

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esStringNoVacio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esOrigenValido(valor: unknown): valor is OrigenAfirmacion {
  return valor === 'usuario' || valor === 'asistente';
}

function validarArregloStrings(
  valor: unknown,
  etiquetaCampo: string,
  errores: string[]
): valor is readonly string[] {
  if (!Array.isArray(valor)) {
    errores.push(`${etiquetaCampo} debe ser un arreglo.`);
    return false;
  }

  let todosValidos = true;
  valor.forEach((elemento, idx) => {
    if (!esStringNoVacio(elemento)) {
      errores.push(`${etiquetaCampo}[${idx}] debe ser un string no vacío.`);
      todosValidos = false;
    }
  });

  return todosValidos;
}

function validarAfirmacion(
  elemento: unknown,
  indice: number,
  idsVistos: Set<string>,
  errores: string[]
): Afirmacion | null {
  const prefijo = `afirmaciones[${indice}]`;

  if (!esObjetoPlano(elemento)) {
    errores.push(`${prefijo} debe ser un objeto JSON.`);
    return null;
  }

  const erroresIniciales = errores.length;

  if (!esStringNoVacio(elemento.id)) {
    errores.push(`${prefijo}.id debe ser un string no vacío.`);
  } else if (idsVistos.has(elemento.id)) {
    errores.push(`${prefijo}.id ("${elemento.id}") está duplicado dentro del documento.`);
  } else {
    idsVistos.add(elemento.id);
  }

  if (!esStringNoVacio(elemento.texto)) {
    errores.push(`${prefijo}.texto debe ser un string no vacío.`);
  }

  if (!esStringNoVacio(elemento.tipo)) {
    errores.push(`${prefijo}.tipo debe ser un string no vacío.`);
  }

  if (!esOrigenValido(elemento.origen)) {
    errores.push(`${prefijo}.origen debe ser "usuario" o "asistente".`);
  }

  if (!esStringNoVacio(elemento.estado)) {
    errores.push(`${prefijo}.estado debe ser un string no vacío.`);
  }

  validarArregloStrings(elemento.fuentes, `${prefijo}.fuentes`, errores);

  if (!esObjetoPlano(elemento.evolucion)) {
    errores.push(`${prefijo}.evolucion debe ser un objeto.`);
  } else {
    if (!esStringNoVacio(elemento.evolucion.tipo)) {
      errores.push(`${prefijo}.evolucion.tipo debe ser un string no vacío.`);
    }
    validarArregloStrings(
      elemento.evolucion.antecedentes,
      `${prefijo}.evolucion.antecedentes`,
      errores
    );
  }

  if (errores.length > erroresIniciales) {
    return null;
  }

  const evolucion = elemento.evolucion as {
    readonly tipo: string;
    readonly antecedentes: readonly string[];
  };

  return {
    id: elemento.id as string,
    texto: elemento.texto as string,
    tipo: elemento.tipo as string,
    origen: elemento.origen as OrigenAfirmacion,
    estado: elemento.estado as string,
    fuentes: [...(elemento.fuentes as readonly string[])],
    evolucion: {
      tipo: evolucion.tipo,
      antecedentes: [...evolucion.antecedentes],
    },
  };
}

export function parsearYValidarAfirmaciones(rawJson: string): ResultadoValidacion {
  if (!esStringNoVacio(rawJson)) {
    return {
      ok: false,
      errores: ['Pega un documento JSON con el arreglo "afirmaciones" antes de procesar.'],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'Error de sintaxis desconocido.';
    return {
      ok: false,
      errores: [`El texto no es un JSON válido: ${detalle}`],
    };
  }

  if (!esObjetoPlano(parsed)) {
    return {
      ok: false,
      errores: ['La raíz del JSON debe ser un objeto que contenga la propiedad "afirmaciones".'],
    };
  }

  if (!Array.isArray(parsed.afirmaciones)) {
    return {
      ok: false,
      errores: ['El documento JSON debe incluir un arreglo en la propiedad "afirmaciones".'],
    };
  }

  const errores: string[] = [];
  const idsVistos = new Set<string>();
  const afirmaciones: Afirmacion[] = [];

  parsed.afirmaciones.forEach((item, indice) => {
    const validada = validarAfirmacion(item, indice, idsVistos, errores);
    if (validada !== null) {
      afirmaciones.push(validada);
    }
  });

  if (errores.length > 0) {
    return {
      ok: false,
      errores,
    };
  }

  return {
    ok: true,
    afirmaciones,
  };
}
