const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

function defaultHeaders() {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleUnauthorized() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('auth:user');
  localStorage.removeItem('auth:role');
  localStorage.removeItem('restaurant_id');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
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
  if (res.status === 401) {
    handleUnauthorized();
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
  getMiMesero: () => request('/meseros/me'),
  // data puede incluir: nombre, estado, sueldo_base, correo (opcional), contrasena (si correo)
  crearMesero: (data) => request('/meseros', { method: 'POST', body: data }),
  actualizarMesero: (id, data) => request(`/meseros/${id}`, { method: 'PUT', body: data }),
  eliminarMesero: (id) => request(`/meseros/${id}`, { method: 'DELETE' }),

  // Mesas (compartido)
  getMesas: () => request('/mesas'),
  // Solo las mesas del usuario actual (requiere X-Usuario-Id)
  getMisMesas: () => request('/mesas/mias'),
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
  pedidosEnCursoMi: () => request('/pedidos/en-curso/mi'),
  facturas: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v!=null && v!==''));
    const qs = q.toString();
    return request(`/pedidos/facturas${qs ? `?${qs}` : ''}`);
  },
  getPedidoAbiertoDeMesa: (mesaId) => request(`/mesas/${mesaId}/pedido-abierto`),
  getPedido: (pedidoId) => request(`/pedidos/${pedidoId}`),
  getPedidoItems: (pedidoId) => request(`/pedidos/${pedidoId}/items`),
  addPedidoItem: (pedidoId, data) => request(`/pedidos/${pedidoId}/items`, { method: 'POST', body: data }),
  deletePedidoItem: (pedidoId, itemId) => request(`/pedidos/${pedidoId}/items/${itemId}`, { method: 'DELETE' }),
  pagarPedido: (pedidoId, data) => request(`/pedidos/${pedidoId}/pagar`, { method: 'POST', body: data }),
  enviarPedidoACaja: (pedidoId) => request(`/pedidos/${pedidoId}/enviar-caja`, { method: 'POST' }),
  pedidosPorCobrar: () => request('/pedidos/por-cobrar'),

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
  ventasPorProducto: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v!=null && v!==''));
    const qs = q.toString();
    return request(`/finanzas/ventas-por-producto${qs ? `?${qs}` : ''}`);
  },
  egresosCategoriasHoy: () => request('/finanzas/egresos-categorias-hoy'),
  egresosCategorias: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v!=null && v!==''));
    const qs = q.toString();
    return request(`/finanzas/egresos-categorias${qs ? `?${qs}` : ''}`);
  },
  egresos: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v!=null && v!==''));
    const qs = q.toString();
    return request(`/finanzas/egresos${qs ? `?${qs}` : ''}`);
  },
  crearEgreso: (data) => request('/finanzas/egresos', { method: 'POST', body: data }),
  actualizarEgreso: (id, data) => request(`/finanzas/egresos/${id}`, { method: 'PUT', body: data }),
  eliminarEgreso: (id) => request(`/finanzas/egresos/${id}`, { method: 'DELETE' }),
  metaHoy: () => request('/finanzas/meta-hoy'),
  evolucionVentas: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v!=null && v!==''));
    const qs = q.toString();
    return request(`/finanzas/evolucion-ventas${qs ? `?${qs}` : ''}`);
  },

  // Nomina
  obtenerNomina: (mesero_id, desde, hasta) => request(`/nomina/movimientos?mesero_id=${mesero_id}&desde=${desde}&hasta=${hasta}`),
  nominaResumen: (mesero_id) => request(`/nomina/resumen${mesero_id ? `?mesero_id=${mesero_id}` : ''}`),
  crearMovimientoNomina: (data) => request('/nomina/movimientos', { method: 'POST', body: data }),
  eliminarMovimientoNomina: (id) => request(`/nomina/movimientos/${id}`, { method: 'DELETE' }),
  marcarPagoNomina: (data) => request('/nomina/pago', { method: 'POST', body: data }),

  // Turnos (mesero)
  meseroCheckin: () => request('/meseros/checkin', { method: 'POST' }),
  meseroCheckout: () => request('/meseros/checkout', { method: 'POST' }),

  // Menú público (sin autenticación)
  getMenuPublico: (restaurantId) =>
    fetch(`https://mesoft.store/api/public/${restaurantId}/menu`).then((r) => r.json()),

  // Productos / Inventario
  getProductos: () => request('/productos'),
  crearProducto: (data) => request('/productos', { method: 'POST', body: data }),
  actualizarProducto: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: data }),
  eliminarProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),

  // Reportes exportables
  reporteVentas: (params) => request('/pedidos/facturas?' + new URLSearchParams(params)),

  // Ranking propinas — backend endpoint; falls back client-side in Home.jsx
  rankingPropinas: (params) => request('/finanzas/ranking-propinas?' + new URLSearchParams(params)),

  // Usuarios — gestión de roles (admin puede actualizar rol de cualquier usuario)
  actualizarUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: data }),

  // Audit logs (Feature 8)
  // TODO: endpoint /audit/logs — uses localStorage fallback in AuditLog.jsx
  getAuditLogs: () => request('/audit/logs'),

  // Restaurante (configuración multi-tenant)
  getRestaurante: () => request('/restaurantes/me'),
  actualizarRestaurante: (data) => request('/restaurantes/me', { method: 'PUT', body: data }),

  // Proveedores
  getProveedores: () => request('/proveedores'),
  crearProveedor: (data) => request('/proveedores', { method: 'POST', body: data }),
  actualizarProveedor: (id, data) => request(`/proveedores/${id}`, { method: 'PUT', body: data }),
  eliminarProveedor: (id) => request(`/proveedores/${id}`, { method: 'DELETE' }),

  // Import CSV masivo de productos
  importarProductosCSV: (rows) => request('/productos/import-csv', { method: 'POST', body: rows }),

  // Reviews (menú público — sin auth, fetch directo)
  getReviewsPublico: (restaurantId, producto_id) => {
    const url = `https://mesoft.store/api/public/${restaurantId}/reviews${producto_id ? `?producto_id=${producto_id}` : ''}`;
    return fetch(url).then(r => r.json());
  },
  crearReviewPublico: (restaurantId, data) =>
    fetch(`https://mesoft.store/api/public/${restaurantId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
};

export default api;