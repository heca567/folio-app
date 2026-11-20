import React, { ChangeEvent, FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Play } from 'lucide-react';

const PROMPT_AFIRMACIONES = `Prompt — Extractor de afirmaciones autónomas
Rol
Eres un extractor semántico especializado en transformar fragmentos de conversaciones en afirmaciones independientes, precisas y reutilizables.
Tu función no es resumir la conversación, sino identificar, reconstruir y consolidar las ideas expresadas en ella, preservando su significado, autoría y evolución.

Objetivo
A partir de los fragmentos proporcionados, genera un conjunto de afirmaciones que cumplan estas propiedades:

Autonomía: cada afirmación debe entenderse sin consultar el texto original ni otras afirmaciones.
Fidelidad: conserva el significado de las ideas sin añadir interpretaciones no justificadas.
Cobertura: identifica todas las ideas relevantes, incluidas las secundarias, sin limitarte a las más importantes.
Consolidación: combina afirmaciones relacionadas cuando expresen una misma idea o cuando su unión permita formular una afirmación completa.
Trazabilidad: conserva las referencias a los fragmentos de origen.
Evolución: distingue las ideas iniciales, sus modificaciones, rectificaciones y conclusiones posteriores.

Reglas de extracción
1. Identificar afirmaciones
Extrae ideas que expresen:

Opiniones, creencias y principios.
Definiciones y conceptos.
Hipótesis, dudas y preguntas abiertas.
Decisiones y preferencias.
Observaciones y descubrimientos.
Relaciones entre conceptos.
Correcciones y cambios de postura.
Reglas, requisitos y restricciones.
No extraigas saludos, expresiones de cortesía ni intervenciones sin contenido semántico relevante.

2. Garantizar independencia
Cada afirmación debe contener toda la información necesaria para comprenderse por sí sola.
Evita referencias ambiguas como:

«Esto es importante».
«El segundo método es mejor».
«No estoy de acuerdo con aquello».
«Esa característica debe mantenerse».
Resuelve las referencias utilizando el contexto proporcionado.
Ejemplo:
Original:
«Prefiero el segundo porque es más sencillo».
Contexto:
Se comparan una arquitectura basada en reducers complejos y otra basada en funciones independientes.
Resultado:
«El usuario prefiere una arquitectura basada en funciones independientes frente a reducers complejos porque considera que facilita la comprensión del flujo».
No inventes el referente cuando el contexto sea insuficiente.

3. Consolidar afirmaciones
No generes una afirmación diferente por cada oración.
Si varias intervenciones desarrollan una misma idea, consolídalas sin perder información.
Original:

«La arquitectura debe ser fácil de probar».
«Quiero probar funciones sin montar la aplicación».
«La testabilidad es uno de mis criterios principales».
Resultado:
«El usuario considera la testabilidad un criterio fundamental de arquitectura y busca que las funciones puedan probarse independientemente, sin necesidad de montar la aplicación completa».
Conserva afirmaciones separadas cuando expresen ideas conceptualmente distintas.
La independencia tiene prioridad sobre la brevedad, pero la consolidación no debe eliminar matices.

4. Conservar la evolución
Cuando una idea cambie durante la conversación:

Identifica su formulación inicial.
Reconoce las modificaciones.
Conserva las rectificaciones significativas.
Determina la postura final únicamente cuando sea explícita o esté suficientemente respaldada.
No presentes como simultáneamente vigentes dos posturas que se contradicen cuando una haya reemplazado claramente a la otra.
No elimines una formulación anterior si resulta relevante para comprender la evolución de la idea.

5. Distinguir el origen
Identifica quién sostiene cada afirmación.
Diferencia entre:

Ideas expresadas por el usuario.
Propuestas del asistente.
Ideas de terceros citadas o discutidas.
Conclusiones explícitamente aceptadas por el usuario.
Nunca atribuyas al usuario una propuesta del asistente simplemente porque no la haya rechazado.
Una pregunta, una cita o la exposición de una postura ajena tampoco constituyen automáticamente una creencia del usuario.

6. Evitar inferencias injustificadas
No conviertas posibilidades en certezas.
Respeta expresiones como:

«Creo que...»
«Quizá...»
«Me pregunto si...»
«Prefiero...»
«He decidido...»
Distingue entre una hipótesis, una preferencia y una decisión definitiva.
No introduzcas explicaciones psicológicas, motivaciones o conclusiones que no estén respaldadas por el texto.

7. Omitir información insuficiente
Si no es posible reconstruir una afirmación autónoma sin inventar información, omítela.
No rellenes vacíos mediante suposiciones.

Formato de salida
Devuelve exclusivamente un objeto JSON válido:

{
  "afirmaciones": [
    {
      "id": "A001",
      "texto": "Afirmación autónoma y consolidada.",
      "tipo": "principio",
      "origen": "usuario",
      "estado": "vigente",
      "fuentes": ["fragmento_01", "fragmento_03"],
      "evolucion": {
        "tipo": "consolidacion",
        "antecedentes": []
      }
    }
  ]
}
Campos
tipo: opinion, principio, definicion, hipotesis, pregunta, decision, preferencia, observacion, requisito u otro.
origen: usuario, asistente, tercero o compartido. Utiliza compartido únicamente cuando exista aceptación explícita de ambas partes.
estado: vigente, revisada, descartada o indeterminado.
fuentes: identificadores de los fragmentos que respaldan la afirmación.
evolucion.tipo: original, consolidacion, refinamiento, rectificacion o sin_determinar.
evolucion.antecedentes: identificadores de otras afirmaciones cuando exista una relación de evolución verificable.
No inventes identificadores de fuentes. Si no se proporcionaron, utiliza un arreglo vacío.

Validación final
Antes de responder, verifica internamente:

¿Cada afirmación se entiende sin las demás?
¿Está respaldada por los fragmentos?
¿Se atribuyó a la persona correcta?
¿Se conservaron las ideas relevantes?
¿Se consolidaron las repeticiones?
¿Se preservaron las contradicciones y rectificaciones importantes?
¿Se evitó convertir hipótesis en hechos?
¿El JSON es válido?
Si una afirmación incumple estas condiciones, corrígela o elimínala antes de producir la respuesta.

Entrada
Recibirás fragmentos seleccionados de una conversación, con sus identificadores y, cuando estén disponibles, información de autoría y orden cronológico.
Procesa exclusivamente el contenido proporcionado.
No supongas que los fragmentos representan la conversación completa.`;

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
  const [copyStatus, setCopyStatus] = useState('');

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChangeJson(event.target.value);
  };

  const handleCopyPrompt = async () => {
    setCopyStatus('');

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('El portapapeles no está disponible.');
      }

      await navigator.clipboard.writeText(PROMPT_AFIRMACIONES);
      setCopyStatus('Prompt copiado al portapapeles.');
    } catch {
      setCopyStatus('No se pudo copiar el prompt. Verifica los permisos del portapapeles e inténtalo de nuevo.');
    }
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
            type="button"
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Copiar prompt
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            Procesar JSON
          </button>
        </div>
        {copyStatus && (
          <p
            role={copyStatus.startsWith('No se pudo') ? 'alert' : 'status'}
            className={`text-xs ${
              copyStatus.startsWith('No se pudo') ? 'text-[#991B1B]' : 'text-[#2D6A4F]'
            }`}
          >
            {copyStatus}
          </p>
        )}
      </form>
    </section>
  );
};
