const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

function defaultHeaders() {
  const rid = localStorage.getItem('restaurant_id');
  return {
    'Content-Type': 'application/json',
    ...(rid ? { 'X-Restaurant-Id': rid } : {}),
  };
}

export async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  let { body } = options;
  const headers = { ...defaultHeaders(), ...(options.headers || {}) };
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, { ...options, body, headers });
  } catch (networkErr) {
    throw new Error('NETWORK');
  }
  const contentType = res.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => '');
  }
  if (!res.ok) {
    const msg = payload?.error || payload?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export const api = {
  // Meseros (admin)
  getMeseros: () => request('/meseros'),
  // data puede incluir: nombre, estado, sueldo_base, correo (opcional), contrasena (si correo)
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