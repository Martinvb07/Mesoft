// Tema claro/oscuro del panel admin.
// Aplica la clase `dark` en <html> (Tailwind v4 con @custom-variant dark) y
// persiste la preferencia. Los estilos oscuros están acotados al shell admin
// (.admin-main, .ms-sidebar y los popovers) para no afectar la landing.

const KEY = 'mesoft_theme';

export function getTheme() {
    try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export function applyTheme(theme) {
    const dark = theme === 'dark';
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
}

let _animTimer = null;
export function setTheme(theme) {
    try { localStorage.setItem(KEY, theme); } catch {}
    // Activa una transición suave de colores/sombras solo durante el cambio
    const root = document.documentElement;
    root.classList.add('theme-transition');
    clearTimeout(_animTimer);
    _animTimer = setTimeout(() => root.classList.remove('theme-transition'), 450);
    applyTheme(theme);
    try { window.dispatchEvent(new CustomEvent('themechange', { detail: theme })); } catch {}
}

export function toggleTheme() {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
}

// El modo oscuro solo aplica dentro del panel admin. En la landing / login /
// mesero el <html> queda siempre claro para no asomar fondos oscuros.
export function isAdminPath() {
    try {
        const p = window.location.pathname;
        return p.startsWith('/admin') || p.startsWith('/mesero') || p.startsWith('/cajero') || p.startsWith('/cocinero');
    } catch { return false; }
}

export function syncThemeForRoute() {
    applyTheme(isAdminPath() ? getTheme() : 'light');
}

export function initTheme() {
    syncThemeForRoute();
}
