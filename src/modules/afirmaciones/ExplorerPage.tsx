import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AfirmacionDetalle } from './AfirmacionDetalle';
import { Afirmaciones } from './Afirmaciones';
import {
  crearFiltrosIniciales,
  extraerOpcionesFiltro,
  filtrarAfirmaciones,
} from './queries';
import { resolverRelaciones } from './relations';
import './style.css';
import { folderRepository } from '../../infrastructure/firebase/folder.repository';
import { userProfileRepository } from '../../infrastructure/firebase/user-profile.repository';
import type { Folder } from '../../types';
import type { Afirmacion, FiltrosAfirmaciones } from './types';

interface ExplorerLocationState {
  readonly afirmaciones?: readonly Afirmacion[];
}

export const ExplorerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as ExplorerLocationState | null;
  const [afirmaciones, setAfirmaciones] = useState<readonly Afirmacion[]>(
    () => locationState?.afirmaciones ?? []
  );
  const [carpetas, setCarpetas] = useState<readonly Folder[]>([]);
  const [cargandoCarpetas, setCargandoCarpetas] = useState(true);
  const [errorCarpetas, setErrorCarpetas] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(afirmaciones[0]?.id ?? null);
  const [sidebarAbierta, setSidebarAbierta] = useState(true);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosAfirmaciones>(crearFiltrosIniciales);

  useEffect(() => {
    let unsubscribeFolders = () => {};
    const unsubscribeAuth = userProfileRepository.subscribe(
      (profile) => {
        unsubscribeFolders();
        setCarpetas([]);
        setCargandoCarpetas(false);
        setErrorCarpetas(null);
        if (profile) {
          unsubscribeFolders = folderRepository.subscribe(
            profile.uid,
            setCarpetas,
            (error) => {
              setCargandoCarpetas(false);
              setErrorCarpetas(error.message);
            }
          );
        }
      },
      (error) => setErrorCarpetas(error.message)
    );

    return () => {
      unsubscribeAuth();
      unsubscribeFolders();
    };
  }, []);

  const opcionesFiltro = useMemo(() => extraerOpcionesFiltro(afirmaciones), [afirmaciones]);
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

  const handleClearFiltros = () => setFiltros(crearFiltrosIniciales());
  const handleChangeTexto = (id: string, texto: string) => {
    setAfirmaciones((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              texto,
              ...(item.texto !== texto ? { estado: 'vigente' } : {}),
            }
          : item
      )
    );
  };
  const handleChangeEstado = (id: string, estado: string) => {
    setAfirmaciones((previous) =>
      previous.map((item) => (item.id === id ? { ...item, estado } : item))
    );
  };
  const handleChangeProyecto = (id: string, proyectoId: string | null) => {
    setAfirmaciones((previous) =>
      previous.map((item) => (item.id === id ? { ...item, proyecto: proyectoId } : item))
    );
  };
  const handleFieldChange =
    (field: keyof FiltrosAfirmaciones) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFiltros((previous) => ({ ...previous, [field]: event.target.value }));
    };

  const navegarAAfirmacion = (id: string) => {
    if (!afirmacionesFiltradas.some((item) => item.id === id)) {
      handleClearFiltros();
    }
    setSelectedId(id);
  };

  const filtrosActivosCount = [
    filtros.busqueda.trim(),
    filtros.tipo,
    filtros.origen,
    filtros.estado,
    filtros.tipoEvolucion,
  ].filter(Boolean).length;
  const hayFiltros = filtrosActivosCount > 0;
  const controlClass =
    'mt-1 w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2.5 py-2 text-xs text-[#18181B] outline-none focus:border-[#1E3A5F]';

  return (
    <div className="afirmaciones-shell flex h-screen w-full flex-col overflow-hidden bg-[#F7F6F0] text-[#18181B] antialiased">
      <header className="relative z-30 shrink-0 border-b border-[#E5E2D9] bg-[#FAF9F4] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarAbierta((previous) => !previous)}
              aria-expanded={sidebarAbierta}
              aria-label={sidebarAbierta ? 'Ocultar afirmaciones' : 'Mostrar afirmaciones'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6D3C9] bg-[#FCFBF8] text-[#1E3A5F] hover:bg-[#EDF1F6]"
            >
              {sidebarAbierta ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
            <div>
              <h1 className="font-serif text-lg font-semibold leading-tight">Explorador de Afirmaciones</h1>
              <p className="text-[11px] text-[#78716C]">Afirmaciones, fuentes y relaciones</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((previous) => !previous)}
              aria-expanded={filtrosAbiertos}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                filtrosAbiertos || hayFiltros
                  ? 'border-[#1E3A5F] bg-[#EDF1F6] text-[#1E3A5F]'
                  : 'border-[#D6D3C9] bg-[#FCFBF8] text-[#18181B] hover:bg-[#F3F1EA]'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buscar y filtrar</span>
              {hayFiltros && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1E3A5F] px-1 text-[10px] text-white">
                  {filtrosActivosCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/afirmaciones')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D3C9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#44403C] hover:bg-[#EFECE4]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cambiar JSON</span>
            </button>
          </div>
        </div>

        {filtrosAbiertos && (
          <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-serif text-sm font-medium">Explora la coleccion</h2>
              {hayFiltros && (
                <button type="button" onClick={handleClearFiltros} className="text-xs font-medium text-[#1E3A5F] underline">
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <label className="block text-[11px] font-medium text-[#57534E] sm:col-span-2">
                Buscar afirmaciones
                <input
                  type="search"
                  value={filtros.busqueda}
                  onChange={handleFieldChange('busqueda')}
                  placeholder="Buscar por texto o ID"
                  className={controlClass}
                />
              </label>
              {[
                ['Tipo', 'tipo', filtros.tipo, opcionesFiltro.tipos],
                ['Origen', 'origen', filtros.origen, opcionesFiltro.origenes],
                ['Estado', 'estado', filtros.estado, opcionesFiltro.estados],
                ['Evolucion', 'tipoEvolucion', filtros.tipoEvolucion, opcionesFiltro.tiposEvolucion],
              ].map(([label, field, value, values]) => (
                <label key={String(field)} className="block text-[11px] font-medium text-[#57534E]">
                  {String(label)}
                  <select
                    value={String(value)}
                    onChange={handleFieldChange(field as keyof FiltrosAfirmaciones)}
                    className={controlClass}
                  >
                    <option value="">Todos</option>
                    {(values as readonly string[]).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-3 p-3 md:p-5">
        {sidebarAbierta && (
          <aside className="absolute inset-y-3 left-3 z-20 w-[min(300px,calc(100%-24px))] shadow-xl md:relative md:inset-auto md:z-auto md:w-[300px] md:shrink-0 md:shadow-none">
            <Afirmaciones
              afirmaciones={afirmacionesFiltradas}
              totalCount={afirmaciones.length}
              selectedId={selectedId}
              onClearFiltros={handleClearFiltros}
              onSelectAfirmacion={setSelectedId}
            />
          </aside>
        )}
        <div className="min-h-0 min-w-0 flex-1">
          <AfirmacionDetalle
            afirmacion={afirmacionSeleccionada}
            relaciones={relacionesSeleccionada}
            carpetas={carpetas}
            cargandoCarpetas={cargandoCarpetas}
            errorCarpetas={errorCarpetas}
            onChangeTexto={handleChangeTexto}
            onChangeEstado={handleChangeEstado}
            onChangeProyecto={handleChangeProyecto}
            onSelectAfirmacion={navegarAAfirmacion}
          />
        </div>
      </main>
    </div>
  );
};

export default ExplorerPage;
