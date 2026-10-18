import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './auth.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </ErrorBoundary>
);