import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { resolverRelaciones } from '../relations';
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

test('resuelve antecedentes y sucesoras explícitas para A014 sin inventar relaciones', () => {
  const afirmaciones = cargarFixture();
  const relaciones = resolverRelaciones('A014', afirmaciones);

  assert.deepEqual(
    relaciones.antecedentes.map((a) => a.id),
    ['A004', 'A009']
  );
  assert.deepEqual(relaciones.antecedentesFaltantes, []);
  assert.deepEqual(
    relaciones.sucesoras.map((a) => a.id),
    ['A015']
  );
});

test('resuelve múltiples sucesoras cuando varias afirmaciones declaran el mismo antecedente', () => {
  const afirmaciones = cargarFixture();
  const relaciones = resolverRelaciones('A002', afirmaciones);

  assert.deepEqual(
    relaciones.antecedentes.map((a) => a.id),
    ['A001']
  );
  assert.deepEqual(
    relaciones.sucesoras.map((a) => a.id),
    ['A008', 'A010', 'A017']
  );
});

test('reporta antecedentesFaltantes si un identificador declarado no existe en el documento', () => {
  const afirmaciones: readonly Afirmacion[] = [
    {
      id: 'A100',
      texto: 'Afirmación con antecedente ausente.',
      tipo: 'observacion',
      origen: 'usuario',
      estado: 'vigente',
      fuentes: ['F1'],
      evolucion: {
        tipo: 'derivacion',
        antecedentes: ['A999'],
      },
    },
  ];

  const relaciones = resolverRelaciones('A100', afirmaciones);
  assert.deepEqual(relaciones.antecedentes, []);
  assert.deepEqual(relaciones.antecedentesFaltantes, ['A999']);
  assert.deepEqual(relaciones.sucesoras, []);
});
