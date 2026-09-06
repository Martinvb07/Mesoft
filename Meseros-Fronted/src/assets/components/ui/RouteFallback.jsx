/* Se muestra mientras se descarga el trozo de JS de la ruta (React.lazy).
   La animación arranca con 300 ms de retraso: si el chunk ya está en caché
   la carga es instantánea y no se alcanza a ver ningún parpadeo. */
export default function RouteFallback() {
    return (
        <div className="route-fallback" role="status" aria-live="polite">
            <span className="route-fallback-spinner" />
            <span className="route-fallback-text">Cargando…</span>
        </div>
    );
}
