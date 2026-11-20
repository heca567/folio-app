export enum WritingStage {
  SEED = 'SEED',
  DRAFT = 'DRAFT',
  REVISION = 'REVISION',
  POLISHED = 'POLISHED',
  PUBLISHED = 'PUBLISHED',
}

export interface StageDescriptor {
  readonly stage: WritingStage;
  readonly label: string;
  readonly description: string;
  readonly order: number;
}

export const STAGE_DESCRIPTORS: Readonly<Record<WritingStage, StageDescriptor>> = {
  [WritingStage.SEED]: {
    stage: WritingStage.SEED,
    label: 'Semilla',
    description: 'Chispas iniciales, fragmentos y premisas sin estructura fija.',
    order: 0,
  },
  [WritingStage.DRAFT]: {
    stage: WritingStage.DRAFT,
    label: 'Borrador',
    description: 'Desarrollo libre del manuscrito priorizando el ritmo narrativo.',
    order: 1,
  },
  [WritingStage.REVISION]: {
    stage: WritingStage.REVISION,
    label: 'Revisión',
    description: 'Edición estructural, coherencia argumental y depuración.',
    order: 2,
  },
  [WritingStage.POLISHED]: {
    stage: WritingStage.POLISHED,
    label: 'Pulido',
    description: 'Corrección de estilo, cadencia y detalles tipográficos.',
    order: 3,
  },
  [WritingStage.PUBLISHED]: {
    stage: WritingStage.PUBLISHED,
    label: 'Publicado',
    description: 'Obra finalizada y lista para archivo o distribución.',
    order: 4,
  },
};

export const WRITING_STAGES_ORDER: readonly WritingStage[] = [
  WritingStage.SEED,
  WritingStage.DRAFT,
  WritingStage.REVISION,
  WritingStage.POLISHED,
  WritingStage.PUBLISHED,
];

export const STAGE_TRANSITION_MATRIX: Readonly<Record<WritingStage, readonly WritingStage[]>> = {
  [WritingStage.SEED]: [WritingStage.DRAFT],
  [WritingStage.DRAFT]: [WritingStage.SEED, WritingStage.REVISION],
  [WritingStage.REVISION]: [WritingStage.DRAFT, WritingStage.POLISHED],
  [WritingStage.POLISHED]: [WritingStage.REVISION, WritingStage.PUBLISHED],
  [WritingStage.PUBLISHED]: [WritingStage.REVISION, WritingStage.POLISHED],
};

export class StageTransitionError extends Error {
  public readonly fromStage: WritingStage;
  public readonly toStage: WritingStage;

  constructor(fromStage: WritingStage, toStage: WritingStage) {
    const fromLabel = STAGE_DESCRIPTORS[fromStage].label;
    const toLabel = STAGE_DESCRIPTORS[toStage].label;
    super(`Transición no permitida de "${fromLabel}" (${fromStage}) hacia "${toLabel}" (${toStage}).`);
    this.name = 'StageTransitionError';
    this.fromStage = fromStage;
    this.toStage = toStage;
  }
}

export function canTransitionStage(from: WritingStage, to: WritingStage): boolean {
  if (from === to) {
    return true;
  }
  const allowedTargets = STAGE_TRANSITION_MATRIX[from];
  return allowedTargets.includes(to);
}

export function getAllowedTransitions(from: WritingStage): readonly WritingStage[] {
  return STAGE_TRANSITION_MATRIX[from];
}

export function isStagePublished(stage: WritingStage): boolean {
  return stage === WritingStage.PUBLISHED;
}

export function isValidWritingStage(value: string): value is WritingStage {
  return Object.values(WritingStage).includes(value as WritingStage);
}
