import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
/* Las utilidades de Tailwind y el modo oscuro se cargan aquí, en el bundle
   inicial. Antes venían arrastradas por los componentes que las importaban;
   con las rutas diferidas eso dejaría sin estilos a cualquier chunk que no
   incluyera uno de esos 9 archivos. */
import './assets/css/landing-tailwind.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import { initTheme } from './lib/theme';

// Aplica el tema guardado antes del render para evitar parpadeo
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);

// Desregistrar cualquier Service Worker previamente instalado (causaba pantallas en blanco tras deploys)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
    });
    caches?.keys?.().then((keys) => keys.forEach((key) => caches.delete(key)));
}