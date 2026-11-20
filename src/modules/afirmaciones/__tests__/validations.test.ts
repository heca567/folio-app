import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { parsearYValidarAfirmaciones } from '../validations';

const fixturePath = path.resolve(import.meta.dirname, 'fixture.json');
const fixtureRaw = fs.readFileSync(fixturePath, 'utf-8');

test('parsea y valida las 17 afirmaciones del fixture sin alterar los datos', () => {
  const resultado = parsearYValidarAfirmaciones(fixtureRaw);

  assert.equal(resultado.ok, true);
  if (!resultado.ok) {
    return;
  }

  assert.equal(resultado.afirmaciones.length, 17);
  const a014 = resultado.afirmaciones.find((item) => item.id === 'A014');
  assert.ok(a014);
  assert.equal(a014.origen, 'asistente');
  assert.deepEqual(a014.fuentes, ['MSG-18', 'MSG-19', 'MSG-20']);
  assert.deepEqual(a014.evolucion.antecedentes, ['A004', 'A009']);
});

test('rechaza texto vacío y JSON sintácticamente inválido', () => {
  const vacio = parsearYValidarAfirmaciones('   ');
  assert.equal(vacio.ok, false);

  const invalido = parsearYValidarAfirmaciones('{ "afirmaciones": [');
  assert.equal(invalido.ok, false);
  if (!invalido.ok) {
    assert.ok(invalido.errores[0]?.includes('JSON válido'));
  }
});

test('rechaza documentos sin arreglo afirmaciones, orígenes inválidos o ids duplicados', () => {
  const sinArreglo = parsearYValidarAfirmaciones('{"items": []}');
  assert.equal(sinArreglo.ok, false);

  const origenInvalido = parsearYValidarAfirmaciones(
    JSON.stringify({
      afirmaciones: [
        {
          id: 'A001',
          texto: 'Texto',
          tipo: 'requisito',
          origen: 'sistema',
          estado: 'vigente',
          fuentes: ['F1'],
          evolucion: { tipo: 'origen', antecedentes: [] },
        },
      ],
    })
  );
  assert.equal(origenInvalido.ok, false);

  const idDuplicado = parsearYValidarAfirmaciones(
    JSON.stringify({
      afirmaciones: [
        {
          id: 'A001',
          texto: 'Uno',
          tipo: 'requisito',
          origen: 'usuario',
          estado: 'vigente',
          fuentes: [],
          evolucion: { tipo: 'origen', antecedentes: [] },
        },
        {
          id: 'A001',
          texto: 'Dos',
          tipo: 'decision',
          origen: 'asistente',
          estado: 'vigente',
          fuentes: [],
          evolucion: { tipo: 'origen', antecedentes: [] },
        },
      ],
    })
  );
  assert.equal(idDuplicado.ok, false);
  if (!idDuplicado.ok) {
    assert.ok(idDuplicado.errores.some((err) => err.includes('duplicado')));
  }
});
