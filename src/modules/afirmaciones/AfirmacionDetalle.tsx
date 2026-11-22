import React, { useEffect, useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { ArrowLeft, ArrowRight, Check, FileText, Pencil, X } from 'lucide-react';
import type { Folder } from '../../types';
import type { Afirmacion, RelacionesAfirmacion } from './types';

interface AfirmacionDetalleProps {
  readonly afirmacion: Afirmacion | null;
  readonly relaciones: RelacionesAfirmacion;
  readonly carpetas: readonly Folder[];
  readonly cargandoCarpetas: boolean;
  readonly errorCarpetas: string | null;
  readonly onChangeTexto: (id: string, texto: string) => void;
  readonly onChangeEstado: (id: string, estado: string) => void;
  readonly onChangeProyecto: (id: string, proyectoId: string | null) => void;
  readonly onSelectAfirmacion: (id: string) => void;
}

export const AfirmacionDetalle: React.FC<AfirmacionDetalleProps> = ({
  afirmacion,
  relaciones,
  carpetas,
  cargandoCarpetas,
  errorCarpetas,
  onChangeTexto,
  onChangeEstado,
  onChangeProyecto,
  onSelectAfirmacion,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(afirmacion?.texto ?? '');
  const [projectQuery, setProjectQuery] = useState('');

  useEffect(() => {
    setIsEditing(false);
    setDraftText(afirmacion?.texto ?? '');
    setProjectQuery('');
  }, [afirmacion?.id, afirmacion?.texto]);

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

  const selectedFolder = carpetas.find((folder) => folder.id === afirmacion.proyecto) ?? null;
  const filteredFolders = projectQuery.trim()
    ? carpetas.filter((folder) =>
        folder.name.toLocaleLowerCase().includes(projectQuery.trim().toLocaleLowerCase())
      )
    : carpetas;

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
          <div className="flex items-center gap-1.5 rounded-md border border-[#D6D3C9] px-2.5 py-1">
            <span>Proyecto:</span>
            <Combobox
              value={selectedFolder}
              onChange={(folder: Folder | null) => {
                onChangeProyecto(afirmacion.id, folder?.id ?? null);
                setProjectQuery('');
              }}
              by="id"
            >
              <div className="relative">
                <ComboboxInput
                  aria-label="Seleccionar carpeta del proyecto"
                  displayValue={(folder: Folder | null) => folder?.name ?? ''}
                  onChange={(event) => setProjectQuery(event.currentTarget.value)}
                  placeholder="Seleccionar carpeta"
                  className="w-36 bg-transparent text-xs outline-none placeholder:text-[#78716C] focus:text-[#1E3A5F]"
                />
                <ComboboxOptions
                  anchor="bottom start"
                  className="z-40 mt-1 max-h-60 min-w-48 overflow-auto rounded-lg border border-[#DDD9CE] bg-[#FCFBF8] py-1 text-xs shadow-lg [--anchor-gap:4px]"
                >
                  <ComboboxOption
                    value={null}
                    className="cursor-pointer px-3 py-2 text-[#57534E] data-[focus]:bg-[#EDF1F6]"
                  >
                    Sin proyecto
                  </ComboboxOption>
                  {filteredFolders.map((folder) => (
                    <ComboboxOption
                      key={folder.id}
                      value={folder}
                      className="cursor-pointer px-3 py-2 text-[#18181B] data-[focus]:bg-[#EDF1F6]"
                    >
                      {folder.name}
                    </ComboboxOption>
                  ))}
                  {filteredFolders.length === 0 && (
                    <div className="px-3 py-2 text-[#78716C]">
                      {errorCarpetas
                        ? 'No se pudieron cargar las carpetas.'
                        : cargandoCarpetas
                          ? 'Cargando carpetas…'
                        : carpetas.length === 0
                          ? 'Inicia sesión en el estudio para ver tus carpetas.'
                          : 'No hay carpetas coincidentes.'}
                    </div>
                  )}
                </ComboboxOptions>
              </div>
            </Combobox>
          </div>
          <span className="rounded-md border border-[#D6D3C9] px-2.5 py-1">
            Estado: {afirmacion.estado}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
          Afirmación
        </h3>
        {isEditing ? (
          <div className="mt-2">
            <textarea
              autoFocus
              value={draftText}
              onChange={(event) => setDraftText(event.currentTarget.value)}
              aria-label="Editar texto de la afirmación"
              className="min-h-32 w-full resize-y rounded-md border border-[#D6D3C9] bg-white p-3 font-serif text-lg leading-relaxed text-[#18181B] outline-none focus:border-[#1E3A5F]"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={!draftText.trim()}
                onClick={() => {
                  onChangeTexto(afirmacion.id, draftText);
                  setIsEditing(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162C49] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftText(afirmacion.texto);
                  setIsEditing(false);
                }}
                className="rounded-md border border-[#D6D3C9] px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#F3F1EA]"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 whitespace-pre-wrap font-serif text-xl leading-relaxed text-[#18181B]">
              {afirmacion.texto}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-white px-3 py-1.5 text-xs font-medium text-[#44403C] hover:border-[#1E3A5F]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => onChangeEstado(afirmacion.id, 'vigente')}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#1E3A5F] bg-[#EDF1F6] px-3 py-1.5 text-xs font-medium text-[#1E3A5F] hover:bg-[#DCE5F0]"
              >
                <Check className="h-3.5 w-3.5" />
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => onChangeEstado(afirmacion.id, 'descartada')}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-white px-3 py-1.5 text-xs font-medium text-[#57534E] hover:border-[#A63D40] hover:text-[#A63D40]"
              >
                <X className="h-3.5 w-3.5" />
                Descartar
              </button>
            </div>
          </>
        )}
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

    </section>
  );
};
