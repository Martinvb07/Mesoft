import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Hook to connect to the Mesoft Socket.io server scoped to a restaurant.
 * @param {string|number|null} restaurantId - The restaurant ID to scope events.
 * @param {(event: string, data: any) => void} onEvent - Callback for incoming events.
 */
export function useSocket(restaurantId, onEvent) {
    const socketRef = useRef(null);
    const onEventRef = useRef(onEvent);

    // Keep the callback reference fresh without reconnecting
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!restaurantId) return;

        socketRef.current = io('https://mesoft.store', {
            query: { restaurantId },
            transports: ['websocket', 'polling'],
        });

        const handle = (event) => (data) => onEventRef.current?.(event, data);

        socketRef.current.on('mesa_update', handle('mesa_update'));
        socketRef.current.on('nuevo_pedido', handle('nuevo_pedido'));
        socketRef.current.on('pedido_cerrado', handle('pedido_cerrado'));

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [restaurantId]);
}
