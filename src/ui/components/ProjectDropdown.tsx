import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, FolderOpen } from 'lucide-react';
import { ProjectFilterKey, ProjectOptionVM } from '../state/editor-ui.state';

interface ProjectDropdownProps {
  readonly projects: readonly ProjectOptionVM[];
  readonly selectedProjectId: ProjectFilterKey;
  readonly isSignedIn: boolean;
  readonly onSelectProject: (projectId: ProjectFilterKey) => void;
}

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  projects,
  selectedProjectId,
  isSignedIn,
  onSelectProject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption =
    projects.find((option) => option.id === selectedProjectId) ?? projects[0];

  const handleSelect = (projectId: ProjectFilterKey) => {
    onSelectProject(projectId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Seleccionar proyecto"
        className="flex w-full items-center justify-between gap-2 rounded-md border border-[#DDD9CE] bg-[#FCFBF8] px-2.5 py-1.5 text-xs font-medium text-[#18181B] hover:bg-[#EFECE4] transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          {activeOption && activeOption.id !== 'ALL' ? (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeOption.color }}
            />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 text-[#1E3A5F] shrink-0" />
          )}
          <span className="truncate">
            {activeOption ? activeOption.name : 'Todos los proyectos'}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#78716C] shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Lista de proyectos"
          className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-[#DDD9CE] bg-[#FCFBF8] py-1 shadow-lg"
        >
          {projects.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.isActive}
              onClick={() => handleSelect(option.id)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                option.isActive
                  ? 'bg-[#EDF1F6] font-medium text-[#1E3A5F]'
                  : 'text-[#44403C] hover:bg-[#F3F1EA]'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {option.id === 'ALL' ? (
                  <FolderOpen className="h-3.5 w-3.5 text-[#1E3A5F] shrink-0" />
                ) : (
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span className="truncate">{option.name}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0 text-[11px] text-[#78716C] tabular-nums">
                <span>{option.noteCount}</span>
                {option.isActive && <Check className="h-3.5 w-3.5 text-[#1E3A5F]" />}
              </span>
            </button>
          ))}

          {!isSignedIn && (
            <div className="border-t border-[#EFECE4] px-3 py-2 text-[11px] leading-snug text-[#78716C]">
              Inicia sesión con Google para listar y guardar tus proyectos en Firestore.
            </div>
          )}

          {isSignedIn && projects.length <= 1 && (
            <div className="border-t border-[#EFECE4] px-3 py-2 text-[11px] leading-snug text-[#78716C]">
              Aún no tienes proyectos creados. Usa &ldquo;Nuevo proyecto&rdquo;.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
