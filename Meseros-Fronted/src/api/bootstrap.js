import { api } from './client';

// Carga datos clave del restaurante del usuario actual y los deja en localStorage
// para que pantallas existentes que aún leen de localStorage sigan funcionando.
export async function bootstrapMeseroData() {
  try {
    // Mesas
    const mesas = await api.getMesas();
    if (Array.isArray(mesas)) {
      // Normalizar mínimamente para compatibilidad con vistas actuales
      const normalized = mesas.map(m => ({
        id: m.id,
        numero: m.numero,
        capacidad: m.capacidad ?? 2,
        estado: m.estado || 'libre',
        meseroId: m.mesero_id ?? null,
        meseroNombre: m.mesero_nombre || '',
        updatedAt: Date.now(),
      }));
      localStorage.setItem('mesas', JSON.stringify(normalized));
    }
  } catch (e) {
    // No bloquear la app si falla; se puede reintentar en cada pantalla
    // console.warn('bootstrap mesas failed', e);
  }
  try {
    // Meseros (compañeros)
    const meseros = await api.getMeseros();
    if (Array.isArray(meseros)) {
      // El componente Meseros.jsx mira la key 'usuarios'
      const mapped = meseros.map(x => ({
        id: x.id,
        usuario_id: x.usuario_id,
        nombre: x.nombre,
        apellido: '',
        rol: 'mesero',
        activo: (x.estado || 'activo') === 'activo',
        estado: x.estado || 'activo',
        correo: x.correo || '',
        telefono: '',
        updatedAt: Date.now(),
      }));
      localStorage.setItem('usuarios', JSON.stringify(mapped));
    }
  } catch (e) {
    // console.warn('bootstrap meseros failed', e);
  }
  try {
    // Productos (no todas las vistas los usan aún, pero dejamos cache)
    const productos = await api.getProductos();
    const items = Array.isArray(productos?.items) ? productos.items : (Array.isArray(productos) ? productos : []);
    localStorage.setItem('productos', JSON.stringify(items));
  } catch (e) {
    // console.warn('bootstrap productos failed', e);
  }
}
