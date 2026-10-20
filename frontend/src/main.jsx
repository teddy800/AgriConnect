import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './auth.jsx';
import { RBACProvider } from './rbac.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initPerformanceOptimizations } from './utils/performance.js';
import './styles.css';

// Initialize performance optimizations
initPerformanceOptimizations();

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <RBACProvider>
            <App />
          </RBACProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </ErrorBoundary>
);