import React, { ChangeEvent, FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Play } from 'lucide-react';

interface PegarJsonProps {
  readonly rawJson: string;
  readonly errores: readonly string[];
  readonly totalCargadas: number;
  readonly onChangeJson: (value: string) => void;
  readonly onProcesar: () => void;
}

export const PegarJson: React.FC<PegarJsonProps> = ({
  rawJson,
  errores,
  totalCargadas,
  onChangeJson,
  onProcesar,
}) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChangeJson(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onProcesar();
  };

  return (
    <section className="rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-base font-medium text-[#18181B]">
            Entrada JSON de afirmaciones
          </h2>
          <p className="mt-0.5 text-xs text-[#57534E]">
            Pega el documento completo con el arreglo <code className="font-mono text-[#1E3A5F]">afirmaciones</code>. El texto se conserva ante cualquier error para corregirlo.
          </p>
        </div>
        {totalCargadas > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D6D3C9] bg-[#F3F1EA] px-2.5 py-1 text-[11px] font-medium text-[#2D6A4F] tabular-nums">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {totalCargadas} {totalCargadas === 1 ? 'afirmación cargada' : 'afirmaciones cargadas'}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          value={rawJson}
          onChange={handleChange}
          rows={7}
          spellCheck={false}
          aria-label="Campo JSON de afirmaciones"
          placeholder={'{\n  "afirmaciones": [\n    {\n      "id": "A001",\n      "texto": "...",\n      "tipo": "...",\n      "origen": "usuario",\n      "estado": "...",\n      "fuentes": ["F001"],\n      "evolucion": { "tipo": "...", "antecedentes": [] }\n    }\n  ]\n}'}
          className="afirmaciones-scroll w-full rounded-lg border border-[#D6D3C9] bg-white p-3 font-mono text-xs leading-relaxed text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#1E3A5F] focus:outline-none"
        />

        {errores.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#991B1B]"
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                No se pudo procesar el JSON
                {totalCargadas > 0
                  ? ' (se mantienen las afirmaciones cargadas anteriormente).'
                  : '.'}
              </span>
            </div>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[11px]">
              {errores.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Procesar JSON
          </button>
        </div>
      </form>
    </section>
  );
};
