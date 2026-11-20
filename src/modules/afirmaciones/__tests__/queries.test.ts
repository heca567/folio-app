import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  crearFiltrosIniciales,
  extraerOpcionesFiltro,
  filtrarAfirmaciones,
} from '../queries';
import type { Afirmacion } from '../types';
import { parsearYValidarAfirmaciones } from '../validations';

const fixtureRaw = fs.readFileSync(
  path.resolve(import.meta.dirname, 'fixture.json'),
  'utf-8'
);

function cargarFixture(): readonly Afirmacion[] {
  const res = parsearYValidarAfirmaciones(fixtureRaw);
  assert.equal(res.ok, true);
  if (!res.ok) {
    throw new Error('Fixture inválido');
  }
  return res.afirmaciones;
}

test('encuentra A014 buscando «entropía» (con y sin tilde) y también por ID', () => {
  const afirmaciones = cargarFixture();
  const base = crearFiltrosIniciales();

  const porEntropia = filtrarAfirmaciones(afirmaciones, {
    ...base,
    busqueda: 'entropía',
  });
  assert.deepEqual(
    porEntropia.map((a) => a.id),
    ['A014']
  );

  const sinTilde = filtrarAfirmaciones(afirmaciones, {
    ...base,
    busqueda: 'entropia',
  });
  assert.deepEqual(
    sinTilde.map((a) => a.id),
    ['A014']
  );

  const porId = filtrarAfirmaciones(afirmaciones, {
    ...base,
    busqueda: 'A014',
  });
  assert.deepEqual(
    porId.map((a) => a.id),
    ['A014']
  );
});

test('los filtros por tipo, origen, estado y evolucion.tipo funcionan independientes y combinados', () => {
  const afirmaciones = cargarFixture();
  const base = crearFiltrosIniciales();

  const soloAsistente = filtrarAfirmaciones(afirmaciones, {
    ...base,
    origen: 'asistente',
  });
  assert.equal(soloAsistente.length, 5);
  assert.ok(soloAsistente.every((a) => a.origen === 'asistente'));

  const soloDescartadas = filtrarAfirmaciones(afirmaciones, {
    ...base,
    estado: 'descartada',
  });
  assert.deepEqual(
    soloDescartadas.map((a) => a.id),
    ['A006', 'A012']
  );

  const combinado = filtrarAfirmaciones(afirmaciones, {
    busqueda: '',
    tipo: 'decision',
    origen: 'usuario',
    estado: 'vigente',
    tipoEvolucion: 'reemplazo',
  });
  assert.deepEqual(
    combinado.map((a) => a.id),
    ['A007', 'A013']
  );
});

test('extraerOpcionesFiltro obtiene listas únicas ordenadas de los valores presentes', () => {
  const afirmaciones = cargarFixture();
  const opciones = extraerOpcionesFiltro(afirmaciones);

  assert.deepEqual(opciones.origenes, ['asistente', 'usuario']);
  assert.ok(opciones.tipos.includes('observacion'));
  assert.ok(opciones.estados.includes('en_revision'));
  assert.ok(opciones.tiposEvolucion.includes('sintesis'));
});
