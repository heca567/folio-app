import React from 'react';
import { ArrowRight } from 'lucide-react';
import { WritingStage } from '../../domain/models/writing-flow.model';
import { StageTransitionOptionVM } from '../state/editor-ui.state';

interface StageTransitionBarProps {
  readonly currentStageLabel: string;
  readonly allowedTransitions: readonly StageTransitionOptionVM[];
  readonly onTransitionStage: (stage: WritingStage) => void;
}

export const StageTransitionBar: React.FC<StageTransitionBarProps> = ({
  currentStageLabel,
  allowedTransitions,
  onTransitionStage,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[#18181B] whitespace-nowrap shrink-0">
        {currentStageLabel}
      </span>
      {allowedTransitions.map((option) => (
        <button
          key={option.targetStage}
          type="button"
          onClick={() => onTransitionStage(option.targetStage)}
          title={option.description}
          className="inline-flex items-center gap-1 rounded-md border border-[#D6D3C9] bg-[#FCFBF8] px-2.5 py-1 text-xs font-medium text-[#1E3A5F] hover:bg-[#EDF1F6] transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowRight className="h-3 w-3" />
          {option.label}
        </button>
      ))}
    </div>
  );
};
