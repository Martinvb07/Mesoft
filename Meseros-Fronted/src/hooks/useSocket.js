import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/* De dónde cuelga el socket:
   1. VITE_SOCKET_URL si la defines a mano.
   2. Si VITE_API_BASE es absoluta (producción: https://mesoft.store/api), se le
      quita el /api y queda el origen.
   3. Si no, el propio origen: en desarrollo Vite hace de proxy de /socket.io
      hacia el backend local (antes esto apuntaba fijo a mesoft.store, así que
      en local el socket nunca conectaba y no llegaba ninguna notificación). */
function resolverUrl() {
    const explicita = import.meta.env.VITE_SOCKET_URL;
    if (explicita) return String(explicita).replace(/\/$/, '');

    const base = import.meta.env.VITE_API_BASE;
    if (base && /^https?:\/\//i.test(base)) {
        try { return new URL(base).origin; } catch { /* si viene rara, seguimos */ }
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Conecta al servidor de sockets de Mesoft para un restaurante.
 * @param {string|number|null} restaurantId
 * @param {(event: string, data: any) => void} onEvent
 */
export function useSocket(restaurantId, onEvent) {
    const socketRef = useRef(null);
    const onEventRef = useRef(onEvent);

    // Mantiene fresca la referencia al callback sin reconectar
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!restaurantId) return;
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const socket = io(resolverUrl(), {
            auth: { token },
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        /* onAny en vez de listar los eventos uno por uno: así no se vuelve a
           repetir lo de `item_listo`, que el backend emitía y aquí nadie
           escuchaba, dejando al mesero sin aviso de "pedido listo". */
        socket.onAny((event, data) => onEventRef.current?.(event, data));

        return () => {
            socket.offAny();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [restaurantId]);
}
