import React, { useEffect } from 'react';

interface AfirmacionMock {
  id: string;
  texto: string;
  tipo: string;
  origen: string;
  estado: string;
  fuentes: string[];
  evolucion: {
    tipo: string;
    antecedentes: string[];
  };
}

const afirmacionesMock: AfirmacionMock[] = [
  {
    id: 'A014',
    texto: 'La memoria de trabajo permite mantener y manipular información durante periodos breves.',
    tipo: 'Teórica',
    origen: 'Investigación',
    estado: 'Vigente',
    fuentes: ['F001', 'F004'],
    evolucion: { tipo: 'Original', antecedentes: [] },
  },
  {
    id: 'A027',
    texto: 'La atención selectiva prioriza ciertos estímulos según las metas actuales.',
    tipo: 'Empírica',
    origen: 'Síntesis',
    estado: 'En revisión',
    fuentes: ['F012'],
    evolucion: { tipo: 'Revisión', antecedentes: ['A014'] },
  },
  {
    id: 'A031',
    texto: 'El sueño contribuye a la consolidación de recuerdos declarativos.',
    tipo: 'Empírica',
    origen: 'Investigación',
    estado: 'Vigente',
    fuentes: ['F021', 'F023', 'F028'],
    evolucion: { tipo: 'Original', antecedentes: [] },
  },
  {
    id: 'A042',
    texto: 'La práctica distribuida favorece la retención a largo plazo frente al estudio concentrado.',
    tipo: 'Teórica',
    origen: 'Síntesis',
    estado: 'Vigente',
    fuentes: ['F033', 'F034'],
    evolucion: { tipo: 'Ampliación', antecedentes: ['A027', 'A031'] },
  },
];

const opciones = {
  tipo: ['Empírica', 'Teórica'],
  origen: ['Investigación', 'Síntesis'],
  estado: ['En revisión', 'Vigente'],
  evolucion: ['Ampliación', 'Original', 'Revisión'],
};

const controlClass =
  'w-full rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2.5 py-2 text-xs text-[#18181B] outline-none focus:border-[#1E3A5F]';

export const AfirmacionesMock: React.FC = () => {
  const [busqueda, setBusqueda] = React.useState('');
  const [tipo, setTipo] = React.useState('');
  const [origen, setOrigen] = React.useState('');
  const [estado, setEstado] = React.useState('');
  const [tipoEvolucion, setTipoEvolucion] = React.useState('');
  const [selectedId, setSelectedId] = React.useState('A014');
  const [filtrosAbiertos, setFiltrosAbiertos] = React.useState(false);

  // Carga de fuentes tipográficas editoriales (Newsreader / Inter / JetBrains Mono)
  useEffect(() => {
    const id = 'afirmaciones-google-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const filtradas = afirmacionesMock.filter((afirmacion) => {
    const termino = busqueda.trim().toLocaleLowerCase();
    return (
      (!termino ||
        afirmacion.id.toLocaleLowerCase().includes(termino) ||
        afirmacion.texto.toLocaleLowerCase().includes(termino)) &&
      (!tipo || afirmacion.tipo === tipo) &&
      (!origen || afirmacion.origen === origen) &&
      (!estado || afirmacion.estado === estado) &&
      (!tipoEvolucion || afirmacion.evolucion.tipo === tipoEvolucion)
    );
  });

  const seleccionada =
    filtradas.find((afirmacion) => afirmacion.id === selectedId) ?? filtradas[0] ?? null;

  const sucesoras = seleccionada
    ? afirmacionesMock.filter((afirmacion) =>
        afirmacion.evolucion.antecedentes.includes(seleccionada.id)
      )
    : [];

  const filtrosActivosCount = [busqueda.trim(), tipo, origen, estado, tipoEvolucion].filter(
    Boolean
  ).length;
  const hayFiltros = filtrosActivosCount > 0;

  const limpiarFiltros = () => {
    setBusqueda('');
    setTipo('');
    setOrigen('');
    setEstado('');
    setTipoEvolucion('');
  };

  // Permite navegar a un antecedente o sucesora incluso si estaba oculto por un filtro activo
  const navegarAAfirmacion = (id: string) => {
    const visibleEnLista = filtradas.some((a) => a.id === id);
    if (!visibleEnLista) {
      limpiarFiltros();
    }
    setSelectedId(id);
  };

  return (
    <div className="afirmaciones-shell flex h-screen w-full flex-col overflow-hidden bg-[#F7F6F0] text-[#18181B] antialiased">
      <style>{`
        .afirmaciones-shell {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .afirmaciones-shell .font-serif {
          font-family: 'Newsreader', Georgia, Cambria, "Times New Roman", Times, serif;
        }
        .afirmaciones-shell .font-mono {
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      `}</style>

      <header className="relative z-20 shrink-0 border-b border-[#E5E2D9] bg-[#FAF9F4] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF1F6] text-lg text-[#1E3A5F]">
              ◈
            </span>
            <div>
              <h1 className="font-serif text-lg font-semibold leading-tight tracking-tight text-[#18181B]">
                Explorador de Afirmaciones
              </h1>
              <p className="text-[11px] text-[#78716C]">
                Inspección de afirmaciones, fuentes y relaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hayFiltros && (
              <div className="flex items-center gap-1.5 rounded-full border border-[#D6D3C9] bg-[#FCFBF8] px-2.5 py-1 text-[11px] text-[#44403C]">
                <span>
                  {filtrosActivosCount} {filtrosActivosCount === 1 ? 'filtro' : 'filtros'}
                </span>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="font-medium text-[#1E3A5F] underline-offset-2 hover:underline"
                >
                  Limpiar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setFiltrosAbiertos((prev) => !prev)}
              aria-expanded={filtrosAbiertos}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filtrosAbiertos || hayFiltros
                  ? 'border-[#1E3A5F] bg-[#EDF1F6] text-[#1E3A5F]'
                  : 'border-[#D6D3C9] bg-[#FCFBF8] text-[#18181B] hover:bg-[#F3F1EA]'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Buscar y filtrar</span>
              {hayFiltros && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1E3A5F] px-1 font-mono text-[10px] font-semibold text-white">
                  {filtrosActivosCount}
                </span>
              )}
            </button>

            <span className="hidden rounded-full border border-[#D6D3C9] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#57534E] xl:inline-block">
              Vista de demostración · datos de ejemplo
            </span>
          </div>
        </div>

        {/* Panel desplegable de búsqueda y filtros (oculto por defecto) */}
        {filtrosAbiertos && (
          <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-sm font-medium text-[#18181B]">
                  Explora la colección
                </h2>
                <p className="text-[11px] text-[#78716C]">
                  Busca por texto o identificador, o combina filtros.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hayFiltros && (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="rounded-md border border-[#D6D3C9] px-2.5 py-1 text-xs font-medium text-[#44403C] transition-colors hover:bg-[#F3F1EA]"
                  >
                    Limpiar filtros
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFiltrosAbiertos(false)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-[#78716C] transition-colors hover:bg-[#F3F1EA] hover:text-[#18181B]"
                >
                  Ocultar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <label className="block text-[11px] font-medium text-[#57534E] sm:col-span-2">
                Buscar afirmaciones
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por texto o ID (ej. A014)…"
                  className={`${controlClass} mt-1`}
                />
              </label>

              {(
                [
                  ['Tipo', tipo, setTipo, opciones.tipo],
                  ['Origen', origen, setOrigen, opciones.origen],
                  ['Estado', estado, setEstado, opciones.estado],
                  ['Evolución', tipoEvolucion, setTipoEvolucion, opciones.evolucion],
                ] as const
              ).map(([label, valor, setValor, valores]) => (
                <label key={label} className="block text-[11px] font-medium text-[#57534E]">
                  {label}
                  <select
                    value={valor}
                    onChange={(event) => setValor(event.target.value)}
                    className={`${controlClass} mt-1`}
                  >
                    <option value="">{label === 'Evolución' ? 'Todas' : 'Todos'}</option>
                    {valores.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Vista maestro-detalle siempre lado a lado y con scroll independiente por columna */}
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 p-3 md:p-5">
        <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] gap-3 sm:grid-cols-[300px_minmax(0,1fr)] md:grid-cols-[340px_minmax(0,1fr)] md:gap-4">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#DDD9CE] bg-[#F3F1EA]">
            <div className="flex shrink-0 items-center justify-between border-b border-[#E5E2D9] px-4 py-3">
              <h2 className="font-serif text-base font-medium text-[#18181B]">
                Afirmaciones <span className="text-sm text-[#78716C]">({filtradas.length})</span>
              </h2>
              <span className="text-[10px] text-[#78716C]">de {afirmacionesMock.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
              {filtradas.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <p className="text-xs text-[#78716C]">
                    Ninguna afirmación coincide con los filtros.
                  </p>
                  {hayFiltros && (
                    <button
                      type="button"
                      onClick={limpiarFiltros}
                      className="mt-3 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-2.5 py-1 text-[11px] font-medium text-[#1E3A5F] hover:border-[#1E3A5F]"
                    >
                      Restablecer filtros
                    </button>
                  )}
                </div>
              ) : (
                filtradas.map((afirmacion) => {
                  const activa = afirmacion.id === (seleccionada?.id ?? selectedId);
                  return (
                    <button
                      key={afirmacion.id}
                      type="button"
                      onClick={() => setSelectedId(afirmacion.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        activa
                          ? 'border-[#1E3A5F] bg-[#FCFBF8] shadow-sm'
                          : 'border-transparent bg-[#FAF9F4]/80 hover:border-[#D6D3C9] hover:bg-[#FCFBF8]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#1E3A5F]">
                          {afirmacion.id}
                        </span>
                        <span className="rounded bg-[#E9E6DC] px-1.5 py-0.5 text-[10px] font-medium text-[#57534E]">
                          {afirmacion.tipo}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#18181B]">
                        {afirmacion.texto}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[#78716C]">
                        <span>{afirmacion.estado}</span>
                        <span>
                          {afirmacion.fuentes.length}{' '}
                          {afirmacion.fuentes.length === 1 ? 'fuente' : 'fuentes'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-5 md:p-6">
            {seleccionada ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFECE4] pb-4">
                  <span className="rounded-md bg-[#EDF1F6] px-2.5 py-1 font-mono text-xs font-semibold text-[#1E3A5F]">
                    {seleccionada.id}
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px] text-[#44403C]">
                    {[seleccionada.tipo, seleccionada.origen, seleccionada.estado].map((tag) => (
                      <span key={tag} className="rounded-md border border-[#D6D3C9] px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                    Afirmación
                  </h3>
                  <p className="mt-2 font-serif text-xl leading-relaxed text-[#18181B]">
                    {seleccionada.texto}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
                    <h4 className="text-xs font-semibold text-[#18181B]">
                      Fuentes ({seleccionada.fuentes.length})
                    </h4>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {seleccionada.fuentes.map((fuente) => (
                        <li
                          key={fuente}
                          className="rounded border border-[#D6D3C9] bg-white px-2 py-1 font-mono text-[11px] text-[#44403C]"
                        >
                          {fuente}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
                    <h4 className="text-xs font-semibold text-[#18181B]">Evolución</h4>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#78716C]">Tipo</dt>
                        <dd className="font-medium text-[#18181B]">
                          {seleccionada.evolucion.tipo}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#78716C]">Antecedentes</dt>
                        <dd className="font-mono text-[#18181B]">
                          {seleccionada.evolucion.antecedentes.length || 'Ninguno'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
                    <h4 className="text-xs font-semibold text-[#18181B]">
                      Antecedentes ({seleccionada.evolucion.antecedentes.length})
                    </h4>
                    {seleccionada.evolucion.antecedentes.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {seleccionada.evolucion.antecedentes.map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => navegarAAfirmacion(id)}
                            className="rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 font-mono text-[11px] text-[#1E3A5F] hover:border-[#1E3A5F]"
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[#78716C]">
                        Sin antecedentes explícitos.
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
                    <h4 className="text-xs font-semibold text-[#18181B]">
                      Sucesoras ({sucesoras.length})
                    </h4>
                    {sucesoras.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {sucesoras.map((sucesora) => (
                          <button
                            key={sucesora.id}
                            type="button"
                            onClick={() => navegarAAfirmacion(sucesora.id)}
                            className="rounded-md border border-[#D6D3C9] bg-white px-2.5 py-1.5 font-mono text-[11px] text-[#1E3A5F] hover:border-[#1E3A5F]"
                          >
                            {sucesora.id}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[#78716C]">
                        Ninguna afirmación la declara como antecedente.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-[#E5E2D9] bg-[#FAF9F4] p-4">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                    Campos completos
                  </h4>
                  <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-[#78716C]">id</dt>
                      <dd className="mt-0.5 font-mono text-[#18181B]">{seleccionada.id}</dd>
                    </div>
                    <div>
                      <dt className="text-[#78716C]">origen</dt>
                      <dd className="mt-0.5 text-[#18181B]">{seleccionada.origen}</dd>
                    </div>
                    <div>
                      <dt className="text-[#78716C]">tipo</dt>
                      <dd className="mt-0.5 text-[#18181B]">{seleccionada.tipo}</dd>
                    </div>
                    <div>
                      <dt className="text-[#78716C]">estado</dt>
                      <dd className="mt-0.5 text-[#18181B]">{seleccionada.estado}</dd>
                    </div>
                  </dl>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center text-center">
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#18181B]">
                    Sin resultados
                  </h2>
                  <p className="mt-2 text-xs text-[#78716C]">
                    Prueba con otros términos o limpia los filtros.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <p className="shrink-0 text-center text-[10px] text-[#78716C]">
          Interfaz de muestra: los datos y las interacciones se mantienen localmente en esta vista.
        </p>
      </main>
    </div>
  );
};

export default function App() {
  return <AfirmacionesMock />;
}