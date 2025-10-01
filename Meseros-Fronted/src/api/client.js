const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function getRestaurantId() {
  try {
    const fromStorage = localStorage.getItem('restaurant_id') || localStorage.getItem('restaurante_id') || localStorage.getItem('tenant');
    if (fromStorage) return fromStorage;
  } catch {}
  return import.meta.env.VITE_RESTAURANT_ID || '';
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const rid = getRestaurantId();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(rid ? { 'X-Restaurant-Id': rid } : {}),
      ...(headers || {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let errText = 'Error de red';
    try { const j = await res.json(); errText = j.error || JSON.stringify(j); } catch {}
    throw new Error(`${res.status} ${res.statusText}: ${errText}`);
  }
  try { return await res.json(); } catch { return null; }
}

export const api = {
  // Meseros (admin)
  getMeseros: () => request('/meseros'),
  crearMesero: (data) => request('/meseros', { method: 'POST', body: data }),
  actualizarMesero: (id, data) => request(`/meseros/${id}`, { method: 'PUT', body: data }),
  eliminarMesero: (id) => request(`/meseros/${id}`, { method: 'DELETE' }),

  // Mesas (compartido)
  getMesas: () => request('/mesas'),
  createMesa: (data) => request('/mesas', { method: 'POST', body: data }),
  updateMesa: (id, data) => request(`/mesas/${id}`, { method: 'PUT', body: data }),
  deleteMesa: (id) => request(`/mesas/${id}`, { method: 'DELETE' }),
  asignarMesa: (id, data) => request(`/mesas/${id}/asignar`, { method: 'POST', body: data }),
  liberarMesa: (id) => request(`/mesas/${id}/liberar`, { method: 'POST' }),
  limpiezaMesa: (id) => request(`/mesas/${id}/limpieza`, { method: 'POST' }),
  finLimpiezaMesa: (id) => request(`/mesas/${id}/fin-limpieza`, { method: 'POST' }),
  reservarMesa: (id, data) => request(`/mesas/${id}/reservar`, { method: 'POST', body: data }),
  cancelarReservaMesa: (id) => request(`/mesas/${id}/cancelar-reserva`, { method: 'POST' }),

  // Pedidos
  pedidosEnCurso: () => request('/pedidos/en-curso'),

  // Finanzas
  ventasHoy: () => request('/finanzas/ventas-hoy'),
  balanceHoy: () => request('/finanzas/balance-hoy'),
  propinas: (mesero_id, desde, hasta) => request(`/finanzas/propinas?mesero_id=${mesero_id}&desde=${desde}&hasta=${hasta}`),
  ticketPromedioHoy: () => request('/finanzas/ticket-promedio-hoy'),
  variacionVentasDia: () => request('/finanzas/variacion-ventas-dia'),
  topProductos: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v!=null && v!==''));
    const qs = q.toString();
    return request(`/finanzas/top-productos${qs ? `?${qs}` : ''}`);
  },
  egresosCategoriasHoy: () => request('/finanzas/egresos-categorias-hoy'),
  metaHoy: () => request('/finanzas/meta-hoy'),

  // Nomina
  obtenerNomina: (mesero_id, desde, hasta) => request(`/nomina/movimientos?mesero_id=${mesero_id}&desde=${desde}&hasta=${hasta}`),
  crearMovimientoNomina: (data) => request('/nomina/movimientos', { method: 'POST', body: data }),
  eliminarMovimientoNomina: (id) => request(`/nomina/movimientos/${id}`, { method: 'DELETE' }),
};

export default api;