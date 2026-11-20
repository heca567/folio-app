import React from 'react';
import { ArrowLeft, ArrowRight, FileText, GitBranch } from 'lucide-react';
import type { Afirmacion, RelacionesAfirmacion } from './types';

interface AfirmacionDetalleProps {
  readonly afirmacion: Afirmacion | null;
  readonly relaciones: RelacionesAfirmacion;
  readonly onSelectAfirmacion: (id: string) => void;
}

export const AfirmacionDetalle: React.FC<AfirmacionDetalleProps> = ({
  afirmacion,
  relaciones,
  onSelectAfirmacion,
}) => {
  if (!afirmacion) {
    return (
      <section className="flex h-full items-center justify-center rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-8 text-center">
        <div className="max-w-sm">
          <h2 className="font-serif text-xl font-medium text-[#18181B]">
            Detalle de afirmación
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
            Selecciona una afirmación de la lista para inspeccionar todos sus campos, fuentes y relaciones explícitas de evolución.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="afirmaciones-scroll flex h-full flex-col overflow-y-auto rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFECE4] pb-4">
        <span className="rounded-md bg-[#EDF1F6] px-2.5 py-1 font-mono text-xs font-semibold text-[#1E3A5F]">
          {afirmacion.id}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#44403C]">
          <span className="rounded-md bg-[#F3F1EA] px-2.5 py-1 font-medium">
            Tipo: {afirmacion.tipo}
          </span>
          <span className="rounded-md border border-[#D6D3C9] px-2.5 py-1">
            Origen: {afirmacion.origen}
          </span>
          <span className="rounded-md border border-[#D6D3C9] px-2.5 py-1">
            Estado: {afirmacion.estado}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
          Afirmación
        </h3>
        <p className="mt-2 font-serif text-xl leading-relaxed text-[#18181B]">
          {afirmacion.texto}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
            <FileText className="h-3.5 w-3.5 text-[#1E3A5F]" />
            <span>Fuentes ({afirmacion.fuentes.length})</span>
          </div>
          {afirmacion.fuentes.length === 0 ? (
            <p className="mt-2 text-xs text-[#78716C]">Sin fuentes declaradas.</p>
          ) : (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {afirmacion.fuentes.map((fuente, index) => (
                <li
                  key={`${fuente}-${index}`}
                  className="rounded border border-[#D6D3C9] bg-white px-2 py-0.5 font-mono text-[11px] text-[#44403C]"
                >
                  {fuente}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
            <GitBranch className="h-3.5 w-3.5 text-[#1E3A5F]" />
            <span>Evolución</span>
          </div>
          <dl className="mt-2 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#78716C]">evolucion.tipo:</dt>
              <dd className="font-medium text-[#18181B]">{afirmacion.evolucion.tipo}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[#78716C]">antecedentes declarados:</dt>
              <dd className="font-mono text-[#18181B]">
                {afirmacion.evolucion.antecedentes.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
            <ArrowLeft className="h-3.5 w-3.5 text-[#1E3A5F]" />
            Antecedentes ({afirmacion.evolucion.antecedentes.length})
          </h4>
          {relaciones.antecedentes.length === 0 && relaciones.antecedentesFaltantes.length === 0 ? (
            <p className="mt-2 text-xs text-[#78716C]">
              Sin antecedentes explícitos declarados.
            </p>
          ) : (
            <div className="mt-2.5 space-y-2">
              {relaciones.antecedentes.map((ant) => (
                <button
                  key={ant.id}
                  type="button"
                  onClick={() => onSelectAfirmacion(ant.id)}
                  className="block w-full rounded-md border border-[#D6D3C9] bg-white p-2.5 text-left hover:border-[#1E3A5F] hover:bg-[#EDF1F6]/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#1E3A5F]">
                      {ant.id}
                    </span>
                    <span className="text-[10px] text-[#78716C]">
                      {ant.tipo} · {ant.estado}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[#27272A]">{ant.texto}</p>
                </button>
              ))}

              {relaciones.antecedentesFaltantes.map((missingId) => (
                <div
                  key={missingId}
                  className="rounded-md border border-dashed border-[#D97706]/50 bg-[#FEF3C7]/50 px-2.5 py-2 text-[11px] text-[#92400E]"
                >
                  ID referido no presente en el JSON: <code className="font-mono font-semibold">{missingId}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
            <ArrowRight className="h-3.5 w-3.5 text-[#1E3A5F]" />
            Sucesoras ({relaciones.sucesoras.length})
          </h4>
          {relaciones.sucesoras.length === 0 ? (
            <p className="mt-2 text-xs text-[#78716C]">
              Ninguna afirmación declara a ésta como antecedente.
            </p>
          ) : (
            <div className="mt-2.5 space-y-2">
              {relaciones.sucesoras.map((suc) => (
                <button
                  key={suc.id}
                  type="button"
                  onClick={() => onSelectAfirmacion(suc.id)}
                  className="block w-full rounded-md border border-[#D6D3C9] bg-white p-2.5 text-left hover:border-[#1E3A5F] hover:bg-[#EDF1F6]/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#1E3A5F]">
                      {suc.id}
                    </span>
                    <span className="text-[10px] text-[#78716C]">
                      {suc.evolucion.tipo} · {suc.estado}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[#27272A]">{suc.texto}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
          Campos completos (sin alteraciones)
        </h4>
        <dl className="mt-2.5 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-[#78716C]">id</dt>
            <dd className="font-mono text-[#18181B]">{afirmacion.id}</dd>
          </div>
          <div>
            <dt className="text-[#78716C]">origen</dt>
            <dd className="text-[#18181B]">{afirmacion.origen}</dd>
          </div>
          <div>
            <dt className="text-[#78716C]">tipo</dt>
            <dd className="text-[#18181B]">{afirmacion.tipo}</dd>
          </div>
          <div>
            <dt className="text-[#78716C]">estado</dt>
            <dd className="text-[#18181B]">{afirmacion.estado}</dd>
          </div>
          <div>
            <dt className="text-[#78716C]">evolucion.tipo</dt>
            <dd className="text-[#18181B]">{afirmacion.evolucion.tipo}</dd>
          </div>
          <div>
            <dt className="text-[#78716C]">evolucion.antecedentes</dt>
            <dd className="font-mono text-[#18181B]">
              {afirmacion.evolucion.antecedentes.length > 0
                ? afirmacion.evolucion.antecedentes.join(', ')
                : '[]'}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
