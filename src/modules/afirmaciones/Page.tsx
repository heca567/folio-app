import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { AfirmacionDetalle } from './AfirmacionDetalle';
import { Afirmaciones } from './Afirmaciones';
import { PegarJson } from './PegarJson';
import {
  crearFiltrosIniciales,
  extraerOpcionesFiltro,
  filtrarAfirmaciones,
} from './queries';
import { resolverRelaciones } from './relations';
import './style.css';
import type { Afirmacion, FiltrosAfirmaciones } from './types';
import { parsearYValidarAfirmaciones } from './validations';

interface ExploradorAfirmacionesPageProps {
  readonly onNavigateHome?: () => void;
}

export const Page: React.FC<ExploradorAfirmacionesPageProps> = ({ onNavigateHome }) => {
  const [rawJson, setRawJson] = useState<string>('');
  const [afirmaciones, setAfirmaciones] = useState<readonly Afirmacion[]>([]);
  const [errores, setErrores] = useState<readonly string[]>([]);
  const [filtros, setFiltros] = useState<FiltrosAfirmaciones>(crearFiltrosIniciales);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleProcesarJson = () => {
    const resultado = parsearYValidarAfirmaciones(rawJson);

    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }

    setErrores([]);
    setAfirmaciones(resultado.afirmaciones);
    setSelectedId((prevSelected) => {
      if (prevSelected && resultado.afirmaciones.some((item) => item.id === prevSelected)) {
        return prevSelected;
      }
      return resultado.afirmaciones[0]?.id ?? null;
    });
  };

  const handleClearFiltros = () => {
    setFiltros(crearFiltrosIniciales());
  };

  const opcionesFiltro = useMemo(
    () => extraerOpcionesFiltro(afirmaciones),
    [afirmaciones]
  );

  const afirmacionesFiltradas = useMemo(
    () => filtrarAfirmaciones(afirmaciones, filtros),
    [afirmaciones, filtros]
  );

  const afirmacionSeleccionada = useMemo(
    () => afirmaciones.find((item) => item.id === selectedId) ?? null,
    [afirmaciones, selectedId]
  );

  const relacionesSeleccionada = useMemo(
    () =>
      afirmacionSeleccionada
        ? resolverRelaciones(afirmacionSeleccionada.id, afirmaciones)
        : { antecedentes: [], antecedentesFaltantes: [], sucesoras: [] },
    [afirmacionSeleccionada, afirmaciones]
  );

  return (
    <div className="afirmaciones-shell flex min-h-screen w-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E2D9] bg-[#FAF9F4] px-5 py-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-[#1E3A5F]" />
          <div>
            <h1 className="font-serif text-lg font-semibold tracking-tight text-[#18181B]">
              Explorador de Afirmaciones
            </h1>
            <p className="text-[11px] text-[#78716C]">
              Inspección estructurada de afirmaciones, fuentes y relaciones explícitas
            </p>
          </div>
        </div>

        {onNavigateHome && (
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al estudio
          </button>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:p-6">
        <PegarJson
          rawJson={rawJson}
          errores={errores}
          totalCargadas={afirmaciones.length}
          onChangeJson={setRawJson}
          onProcesar={handleProcesarJson}
        />

        <div className="grid min-h-[480px] flex-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4 min-h-[380px] lg:max-h-[680px]">
            <Afirmaciones
              afirmaciones={afirmacionesFiltradas}
              totalCount={afirmaciones.length}
              filtros={filtros}
              opcionesFiltro={opcionesFiltro}
              selectedId={selectedId}
              onChangeFiltros={setFiltros}
              onClearFiltros={handleClearFiltros}
              onSelectAfirmacion={setSelectedId}
            />
          </div>

          <div className="lg:col-span-7 xl:col-span-8 min-h-[380px] lg:max-h-[680px]">
            <AfirmacionDetalle
              afirmacion={afirmacionSeleccionada}
              relaciones={relacionesSeleccionada}
              onSelectAfirmacion={setSelectedId}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Page;
