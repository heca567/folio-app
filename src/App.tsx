import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { appContainer } from './app/container';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { WritingStudioPage } from './ui/components/WritingStudioPage';

const AfirmacionesPage = lazy(() => import('./modules/afirmaciones/Page'));
const AfirmacionesExplorerPage = lazy(() => import('./modules/afirmaciones/ExplorerPage'));

function WritingStudioRoute() {
  const navigate = useNavigate();

  return (
    <WritingStudioPage
      useCases={appContainer}
      onNavigateAfirmaciones={() => navigate('/afirmaciones')}
    />
  );
}

function AfirmacionesRoute() {
  const navigate = useNavigate();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F6F5F0] text-xs text-[#57534E]">
          Cargando Explorador de Afirmaciones…
        </div>
      }
    >
      <AfirmacionesPage onNavigateHome={() => navigate('/')} />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<WritingStudioRoute />} />
          <Route path="/afirmaciones/explorar" element={<AfirmacionesExplorerPage />} />
          <Route path="/afirmaciones/*" element={<AfirmacionesRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
