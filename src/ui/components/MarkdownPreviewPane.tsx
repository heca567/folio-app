import React from 'react';
import { MarkdownBlockVM } from '../state/editor-ui.state';

interface MarkdownPreviewPaneProps {
  readonly blocks: readonly MarkdownBlockVM[];
}

export const MarkdownPreviewPane: React.FC<MarkdownPreviewPaneProps> = ({ blocks }) => {
  if (blocks.length === 0) {
    return (
      <p className="font-serif text-base italic text-[#A8A29E]">
        Este manuscrito aún no tiene contenido para previsualizar.
      </p>
    );
  }

  return (
    <div className="space-y-4 font-serif text-[17px] leading-[1.8] text-[#27272A]">
      {blocks.map((block) => {
        if (block.kind === 'h1') {
          return (
            <h1 key={block.id} className="pt-2 text-2xl font-semibold text-[#18181B]">
              {block.text}
            </h1>
          );
        }
        if (block.kind === 'h2') {
          return (
            <h2 key={block.id} className="pt-2 text-xl font-semibold text-[#18181B]">
              {block.text}
            </h2>
          );
        }
        if (block.kind === 'h3') {
          return (
            <h3 key={block.id} className="pt-1 text-lg font-medium text-[#18181B]">
              {block.text}
            </h3>
          );
        }
        if (block.kind === 'quote') {
          return (
            <blockquote
              key={block.id}
              className="rounded-md border border-[#E5E2D9] bg-[#F4F2EB] px-4 py-3 italic text-[#44403C]"
            >
              {block.text}
            </blockquote>
          );
        }
        if (block.kind === 'list-item') {
          return (
            <div key={block.id} className="flex items-start gap-2.5 pl-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E3A5F]" />
              <span>{block.text}</span>
            </div>
          );
        }
        if (block.kind === 'code') {
          return (
            <pre
              key={block.id}
              className="overflow-x-auto rounded-md border border-[#E5E2D9] bg-[#F3F1EA] p-3 font-mono text-xs leading-relaxed text-[#27272A]"
            >
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.kind === 'hr') {
          return <hr key={block.id} className="my-6 border-[#E5E2D9]" />;
        }
        return <p key={block.id}>{block.text}</p>;
      })}
    </div>
  );
};
