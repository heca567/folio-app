import React from 'react';

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ha ocurrido un error inesperado en la aplicación.',
    };
  }

  public override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, info);
  }

  public override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F6F5F0] px-6 py-12 text-[#18181B]">
          <div className="w-full max-w-md rounded-xl border border-[#DDD9CE] bg-[#FCFBF8] p-6 shadow-sm">
            <h1 className="font-serif text-xl font-medium text-[#18181B]">
              Algo salió mal
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
              Se detectó un problema al sincronizar o renderizar el estudio de escritura.
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-[#F3F1EA] p-2.5 font-mono text-[11px] text-[#44403C]">
              {this.state.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-md bg-[#1E3A5F] py-2 text-xs font-medium text-[#FCFBF8] hover:bg-[#162C49] transition-colors"
            >
              Recargar estudio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
