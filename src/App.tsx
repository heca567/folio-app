import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { appContainer } from './app/container';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { WritingStudioPage } from './ui/components/WritingStudioPage';

const AfirmacionesPage = lazy(() => import('./modules/afirmaciones/Page'));

const AFIRMACIONES_PATH = '/afirmaciones';

function isAfirmacionesRoute(pathname: string): boolean {
  return pathname === AFIRMACIONES_PATH || pathname.startsWith(`${AFIRMACIONES_PATH}/`);
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((targetPath: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      setPathname(targetPath);
    }
  }, []);

  return (
    <ErrorBoundary>
      {isAfirmacionesRoute(pathname) ? (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#F6F5F0] text-xs text-[#57534E]">
              Cargando Explorador de Afirmaciones…
            </div>
          }
        >
          <AfirmacionesPage onNavigateHome={() => navigateTo('/')} />
        </Suspense>
      ) : (
        <WritingStudioPage
          useCases={appContainer}
          onNavigateAfirmaciones={() => navigateTo(AFIRMACIONES_PATH)}
        />
      )}
    </ErrorBoundary>
  );
}
