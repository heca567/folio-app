import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PegarJson } from './PegarJson';
import './style.css';
import type { Afirmacion } from './types';
import { parsearYValidarAfirmaciones } from './validations';

interface ExploradorAfirmacionesPageProps {
  readonly onNavigateHome?: () => void;
}

export const Page: React.FC<ExploradorAfirmacionesPageProps> = ({ onNavigateHome }) => {
  const [rawJson, setRawJson] = useState<string>('');
  const [afirmaciones, setAfirmaciones] = useState<readonly Afirmacion[]>([]);
  const [errores, setErrores] = useState<readonly string[]>([]);
  const navigate = useNavigate();

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

  const handleProcesarJson = () => {
    const resultado = parsearYValidarAfirmaciones(rawJson);

    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }

    setErrores([]);
    setAfirmaciones(resultado.afirmaciones);
    navigate('/afirmaciones/explorar', {
      state: { afirmaciones: resultado.afirmaciones },
    });
  };

  return (
    <div className="afirmaciones-shell flex h-screen w-full flex-col overflow-hidden bg-[#F7F6F0] text-[#18181B] antialiased">
      <header className="shrink-0 border-b border-[#E5E2D9] bg-[#FAF9F4] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF1F6] text-[#1E3A5F]">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h1 className="font-serif text-lg font-semibold leading-tight tracking-tight">
                Entrada de afirmaciones
              </h1>
              <p className="text-[11px] text-[#78716C]">
                Pega el documento JSON y abre el explorador
              </p>
            </div>
          </div>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6D3C9] bg-[#FCFBF8] px-3 py-1.5 text-xs font-medium text-[#44403C] transition-colors hover:bg-[#EFECE4]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al estudio
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-3 md:p-5">
        <PegarJson
          rawJson={rawJson}
          errores={errores}
          totalCargadas={afirmaciones.length}
          onChangeJson={setRawJson}
          onProcesar={handleProcesarJson}
        />
      </main>
    </div>
  );
};

export default Page;
