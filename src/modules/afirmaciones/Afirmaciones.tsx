import React, { ChangeEvent } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import type {
  Afirmacion,
  FiltrosAfirmaciones,
  OpcionesFiltroAfirmaciones,
} from './types';

interface AfirmacionesProps {
  readonly afirmaciones: readonly Afirmacion[];
  readonly totalCount: number;
  readonly filtros: FiltrosAfirmaciones;
  readonly opcionesFiltro: OpcionesFiltroAfirmaciones;
  readonly selectedId: string | null;
  readonly onChangeFiltros: (next: FiltrosAfirmaciones) => void;
  readonly onClearFiltros: () => void;
  readonly onSelectAfirmacion: (id: string) => void;
}

export const Afirmaciones: React.FC<AfirmacionesProps> = ({
  afirmaciones,
  totalCount,
  filtros,
  opcionesFiltro,
  selectedId,
  onChangeFiltros,
  onClearFiltros,
  onSelectAfirmacion,
}) => {
  const hayFiltrosActivos =
    filtros.busqueda.trim().length > 0 ||
    filtros.tipo !== '' ||
    filtros.origen !== '' ||
    filtros.estado !== '' ||
    filtros.tipoEvolucion !== '';

  const handleFieldChange =
    (field: keyof FiltrosAfirmaciones) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChangeFiltros({
        ...filtros,
        [field]: event.target.value,
      });
    };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-[#DDD9CE] bg-[#F3F1EA]">
      <div className="border-b border-[#E5E2D9] px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-base font-medium text-[#18181B]">
            Afirmaciones ({afirmaciones.length}
            {totalCount !== afirmaciones.length ? ` de ${totalCount}` : ''})
          </h2>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={onClearFiltros}
              className="inline-flex items-center gap-1 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-2 py-1 text-[11px] font-medium text-[#44403C] hover:bg-[#EFECE4] transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#78716C]" />
          <input
            type="search"
            value={filtros.busqueda}
            onChange={handleFieldChange('busqueda')}
            placeholder="Buscar por texto o ID (ej. A014, entropía)…"
            aria-label="Buscar afirmaciones por texto o identificador"
            className="w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] py-1.5 pl-8 pr-3 text-xs text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#1E3A5F] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[11px] font-medium text-[#57534E]">
            Tipo
            <select
              value={filtros.tipo}
              onChange={handleFieldChange('tipo')}
              className="mt-1 w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2 py-1 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
            >
              <option value="">Todos</option>
              {opcionesFiltro.tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-medium text-[#57534E]">
            Origen
            <select
              value={filtros.origen}
              onChange={handleFieldChange('origen')}
              className="mt-1 w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2 py-1 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
            >
              <option value="">Todos</option>
              {opcionesFiltro.origenes.map((origen) => (
                <option key={origen} value={origen}>
                  {origen}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-medium text-[#57534E]">
            Estado
            <select
              value={filtros.estado}
              onChange={handleFieldChange('estado')}
              className="mt-1 w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2 py-1 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
            >
              <option value="">Todos</option>
              {opcionesFiltro.estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-medium text-[#57534E]">
            Evolución
            <select
              value={filtros.tipoEvolucion}
              onChange={handleFieldChange('tipoEvolucion')}
              className="mt-1 w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2 py-1 text-xs text-[#18181B] focus:border-[#1E3A5F] focus:outline-none"
            >
              <option value="">Todas</option>
              {opcionesFiltro.tiposEvolucion.map((tipoEv) => (
                <option key={tipoEv} value={tipoEv}>
                  {tipoEv}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="afirmaciones-scroll flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {totalCount === 0 ? (
          <div className="px-3 py-10 text-center text-xs leading-relaxed text-[#78716C]">
            Pega un JSON arriba y pulsa <strong>Procesar JSON</strong> para explorar las afirmaciones.
          </div>
        ) : afirmaciones.length === 0 ? (
          <div className="px-3 py-10 text-center text-xs leading-relaxed text-[#78716C]">
            Ninguna afirmación coincide con la búsqueda o filtros activos.
          </div>
        ) : (
          afirmaciones.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectAfirmacion(item.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-[#1E3A5F] bg-[#FCFBF8] shadow-xs'
                    : 'border-transparent bg-[#FAF9F4]/80 hover:border-[#D6D3C9] hover:bg-[#FCFBF8]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-mono text-[11px] font-semibold text-[#1E3A5F]">
                    {item.id}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#57534E]">
                    <span className="rounded bg-[#E9E6DC] px-1.5 py-0.5 font-medium">
                      {item.tipo}
                    </span>
                    <span className="rounded border border-[#D6D3C9] px-1.5 py-0.5">
                      {item.origen}
                    </span>
                    <span className="rounded border border-[#D6D3C9] px-1.5 py-0.5">
                      {item.estado}
                    </span>
                  </div>
                </div>

                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#18181B]">
                  {item.texto}
                </p>

                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#78716C]">
                  <span>Evolución: {item.evolucion.tipo}</span>
                  <span className="tabular-nums">
                    {item.fuentes.length} {item.fuentes.length === 1 ? 'fuente' : 'fuentes'} ·{' '}
                    {item.evolucion.antecedentes.length} ant.
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};
