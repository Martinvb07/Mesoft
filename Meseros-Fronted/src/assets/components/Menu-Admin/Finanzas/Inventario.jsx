import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { HiCube, HiCheckCircle, HiExclamationTriangle, HiCurrencyDollar, HiBanknotes, HiXMark } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Finanzas/Inventario.css';

// Utilidades
const LS_KEY = 'inventario_productos_v1';
const nowIso = () => new Date().toISOString();
const toCurrency = (n) => (isNaN(n) ? '$0' : n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }));
const clampNum = (v, min = 0) => (isNaN(v) ? min : Math.max(min, v));
const parseNum = (v) => {
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
};

function safeRead(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        return parsed;
    } catch (_) { return fallback; }
}

function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* noop */ }
}

function seedIfEmpty(list) {
    if (list && list.length) return list;
    const seed = [
        { id: crypto.randomUUID?.() || 'p1', sku: 'CAF-ESP-01', nombre: 'Café Espresso', categoria: 'Bebidas', costo: 1500, precio: 4000, stock: 80, minStock: 20, activo: true, createdAt: nowIso(), updatedAt: nowIso() },
        { id: crypto.randomUUID?.() || 'p2', sku: 'SAN-TRI-01', nombre: 'Sandwich de pollo', categoria: 'Comidas', costo: 4500, precio: 12000, stock: 35, minStock: 10, activo: true, createdAt: nowIso(), updatedAt: nowIso() },
        { id: crypto.randomUUID?.() || 'p3', sku: 'JUG-NAR-01', nombre: 'Jugo de naranja', categoria: 'Bebidas', costo: 2000, precio: 7000, stock: 12, minStock: 15, activo: true, createdAt: nowIso(), updatedAt: nowIso() },
    ];
    safeWrite(LS_KEY, seed);
    return seed;
}

const Inventario = () => {
    // Estado principal
    const [productos, setProductos] = useState(() => seedIfEmpty(safeRead(LS_KEY, [])));
    const [busqueda, setBusqueda] = useState('');
    const [fCategoria, setFCategoria] = useState('todas');
    const [fEstado, setFEstado] = useState('todos'); // todos | activos | inactivos
    const [sort, setSort] = useState({ by: 'nombre', dir: 'asc' });

    // Modal estado
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ sku: '', nombre: '', categoria: '', costo: '', precio: '', stock: '', minStock: '', activo: true });

    useEffect(() => { safeWrite(LS_KEY, productos); }, [productos]);

    // Derivados y métricas
    const categorias = useMemo(() => {
        const s = new Set(productos.map(p => (p.categoria || '').trim()).filter(Boolean));
        return Array.from(s).sort();
    }, [productos]);

    const filtered = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        let arr = productos.filter(p => {
        const inText = !q || [p.sku, p.nombre, p.categoria].some(x => String(x || '').toLowerCase().includes(q));
        const catOk = fCategoria === 'todas' || (p.categoria || '') === fCategoria;
        const estOk = fEstado === 'todos' || (fEstado === 'activos' ? p.activo : !p.activo);
        return inText && catOk && estOk;
        });
        const dir = sort.dir === 'asc' ? 1 : -1;
        const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0) * dir;
        arr.sort((a, b) => {
        const k = sort.by;
        if (k === 'precio' || k === 'costo' || k === 'stock' || k === 'minStock') return cmp(a[k], b[k]);
        return cmp(String(a[k] || '').toLowerCase(), String(b[k] || '').toLowerCase());
        });
        return arr;
    }, [productos, busqueda, fCategoria, fEstado, sort]);

    const metrics = useMemo(() => {
        const total = productos.length;
        const activos = productos.filter(p => p.activo).length;
        const bajos = productos.filter(p => p.stock <= p.minStock).length;
        const valorCosto = productos.reduce((s, p) => s += (p.costo || 0) * (p.stock || 0), 0);
        const valorVenta = productos.reduce((s, p) => s += (p.precio || 0) * (p.stock || 0), 0);
        return { total, activos, bajos, valorCosto, valorVenta };
    }, [productos]);

    // Handlers
    const abrirNuevo = () => {
        setEditId(null);
        setForm({ sku: '', nombre: '', categoria: '', costo: '', precio: '', stock: '', minStock: '', activo: true });
        setShowModal(true);
    };
    const abrirEditar = (id) => {
        const p = productos.find(x => x.id === id);
        if (!p) return;
        setEditId(id);
        setForm({ sku: p.sku, nombre: p.nombre, categoria: p.categoria || '', costo: String(p.costo), precio: String(p.precio), stock: String(p.stock), minStock: String(p.minStock), activo: !!p.activo });
        setShowModal(true);
    };
    const cerrarModal = () => setShowModal(false);

    const skuExiste = (sku, ignoreId = null) => productos.some(p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== ignoreId);

    const guardar = async () => {
        const sku = form.sku.trim();
        const nombre = form.nombre.trim();
        const categoria = form.categoria.trim();
        const costo = clampNum(parseNum(form.costo));
        const precio = clampNum(parseNum(form.precio));
        const stock = Math.floor(clampNum(parseNum(form.stock)));
        const minStock = Math.floor(clampNum(parseNum(form.minStock)));
        const activo = !!form.activo;

        if (!sku) return Swal.fire({ icon: 'error', title: 'SKU requerido' });
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Nombre requerido' });
        if (skuExiste(sku, editId)) return Swal.fire({ icon: 'error', title: 'SKU duplicado' });
        if (precio < 0 || costo < 0) return Swal.fire({ icon: 'error', title: 'Precios y costos no pueden ser negativos' });
        if (precio < costo) {
        const res = await Swal.fire({ icon: 'warning', title: 'Precio menor que el costo', text: '¿Deseas continuar de todos modos?', showCancelButton: true, confirmButtonText: 'Sí, continuar', cancelButtonText: 'Cancelar' });
        if (!res.isConfirmed) return;
    }

    if (editId) {
        setProductos(prev => prev.map(p => p.id === editId ? { ...p, sku, nombre, categoria, costo, precio, stock, minStock, activo, updatedAt: nowIso() } : p));
        Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 900, showConfirmButton: false });
    } else {
        const nuevo = { id: crypto.randomUUID?.() || String(Date.now()), sku, nombre, categoria, costo, precio, stock, minStock, activo, createdAt: nowIso(), updatedAt: nowIso() };
        setProductos(prev => [nuevo, ...prev]);
        Swal.fire({ icon: 'success', title: 'Producto creado', timer: 900, showConfirmButton: false });
    }
        setShowModal(false);
    };

    const eliminar = async (id) => {
        const p = productos.find(x => x.id === id);
        if (!p) return;
        const res = await Swal.fire({ title: `Eliminar ${p.nombre}`, text: `Se eliminará el producto SKU ${p.sku}. Esta acción no se puede deshacer.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#ef4444' });
        if (!res.isConfirmed) return;
        setProductos(prev => prev.filter(x => x.id !== id));
        Swal.fire({ icon: 'success', title: 'Producto eliminado', timer: 900, showConfirmButton: false });
    };

    const exportarCSV = () => {
        const headers = ['SKU','Nombre','Categoria','Costo','Precio','Stock','MinStock','Activo','Creado','Actualizado'];
        const rows = productos.map(p => [p.sku, p.nombre, p.categoria || '', p.costo, p.precio, p.stock, p.minStock, p.activo ? 'Sí' : 'No', p.createdAt, p.updatedAt]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `inventario_${new Date().toISOString().slice(0,10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const restablecerDemo = async () => {
        const res = await Swal.fire({ title: 'Restablecer datos de demo', text: 'Se reemplazará tu inventario actual por datos de ejemplo.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, restablecer', cancelButtonText: 'Cancelar' });
        if (!res.isConfirmed) return;
        const seed = seedIfEmpty([]); // genera nueva semilla
        setProductos(seed);
        Swal.fire({ icon: 'success', title: 'Inventario restablecido', timer: 900, showConfirmButton: false });
    };

    const toggleSort = (by) => {
        setSort(prev => {
        if (prev.by === by) return { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
        return { by, dir: 'asc' };
        });
    };

    return (
        <div className="fin-page">
        <div className="fin-header">
            <h1>Finanzas · Inventario</h1>
            <p className="muted">Gestión de productos, stock y valoraciones.</p>
        </div>

        <div className="fin-metrics">
            <div className="metric-card"><div className="metric-icon"><HiCube /></div><div className="metric-info"><div className="metric-value">{metrics.total}</div><div className="metric-label">Productos</div></div></div>
            <div className="metric-card"><div className="metric-icon"><HiCheckCircle /></div><div className="metric-info"><div className="metric-value">{metrics.activos}</div><div className="metric-label">Activos</div></div></div>
            <div className="metric-card"><div className="metric-icon"><HiExclamationTriangle /></div><div className="metric-info"><div className="metric-value">{metrics.bajos}</div><div className="metric-label">Bajo stock</div></div></div>
            <div className="metric-card"><div className="metric-icon"><HiCurrencyDollar /></div><div className="metric-info"><div className="metric-value">{toCurrency(metrics.valorCosto)}</div><div className="metric-label">Valor al costo</div></div></div>
            <div className="metric-card"><div className="metric-icon"><HiBanknotes /></div><div className="metric-info"><div className="metric-value">{toCurrency(metrics.valorVenta)}</div><div className="metric-label">Valor a venta</div></div></div>
        </div>

        <div className="fin-card">
            <div className="toolbar">
            <div className="left">
                <button className="btn primary" onClick={abrirNuevo}>Nuevo producto</button>
            </div>
            <div className="right">
                <input className="input" placeholder="Buscar SKU, nombre, categoría" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                <select className="input" value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
                <option value="todas">Todas las categorías</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="input" value={fEstado} onChange={e => setFEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
                </select>
                <button className="btn" onClick={exportarCSV}>Exportar CSV</button>
                <button className="btn danger" onClick={restablecerDemo}>Restablecer demo</button>
            </div>
            </div>

            {filtered.length === 0 ? (
            <div className="empty">No se encontraron productos con los filtros actuales.</div>
            ) : (
            <div className="table-wrap">
                <table className="table">
                <thead>
                    <tr>
                    <th className="th-sortable" onClick={() => toggleSort('sku')}>SKU {sort.by==='sku' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                    <th className="th-sortable" onClick={() => toggleSort('nombre')}>Nombre {sort.by==='nombre' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                    <th className="th-sortable" onClick={() => toggleSort('categoria')}>Categoría {sort.by==='categoria' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                    <th className="th-num th-sortable" onClick={() => toggleSort('stock')}>Stock {sort.by==='stock' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                    <th className="th-num th-sortable" onClick={() => toggleSort('minStock')}>Mín</th>
                    <th className="th-num th-sortable" onClick={() => toggleSort('costo')}>Costo {sort.by==='costo' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                    <th className="th-num th-sortable" onClick={() => toggleSort('precio')}>Precio {sort.by==='precio' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                    <th>Margen</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map(p => {
                    const margen = p.precio > 0 ? ((p.precio - p.costo) / p.precio) : 0;
                    const bajo = p.stock <= p.minStock;
                    return (
                        <tr key={p.id} className={!p.activo ? 'row-muted' : ''}>
                        <td>{p.sku}</td>
                        <td>{p.nombre}</td>
                        <td>{p.categoria || '-'}</td>
                        <td className="td-num">
                            {p.stock}
                            {bajo && <span className="chip warning">Bajo</span>}
                        </td>
                        <td className="td-num">{p.minStock}</td>
                        <td className="td-num">{toCurrency(p.costo)}</td>
                        <td className="td-num">{toCurrency(p.precio)}</td>
                        <td>
                            <span className={`chip ${margen >= 0.35 ? 'success' : margen >= 0.15 ? 'info' : 'danger'}`}>
                            {(margen*100).toFixed(0)}%
                            </span>
                        </td>
                        <td>
                            <span className={`status ${p.activo ? 'on' : 'off'}`}>
                            <span className="dot" /> {p.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td>
                            <div className="row-actions">
                            <button className="btn sm" onClick={() => abrirEditar(p.id)}>Editar</button>
                            <button className="btn sm danger" onClick={() => eliminar(p.id)}>Eliminar</button>
                            </div>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            )}
        </div>

        {showModal && (
            <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card lg">
                <div className="modal-header">
                <h3>{editId ? 'Editar producto' : 'Nuevo producto'}</h3>
                <button className="icon-btn" onClick={cerrarModal} aria-label="Cerrar"><HiXMark /></button>
                </div>
                <div className="modal-body">
                <p className="modal-subtitle">Completa los datos del producto. Los campos marcados con * son obligatorios.</p>
                <div className="form-grid">
                    <label>
                    <span>SKU *</span>
                    <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ej. CAF-ESP-01" />
                    </label>
                    <label>
                    <span>Nombre *</span>
                    <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Café Espresso" />
                    </label>
                    <label>
                    <span>Categoría</span>
                    <input list="cat-list" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ej. Bebidas" />
                    <datalist id="cat-list">
                        {categorias.map(c => <option key={c} value={c} />)}
                    </datalist>
                    </label>
                    <label>
                    <span>Costo</span>
                    <input type="number" inputMode="decimal" min="0" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} />
                    </label>
                    <label>
                    <span>Precio</span>
                    <input type="number" inputMode="decimal" min="0" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
                    </label>
                    <label>
                    <span>Stock</span>
                    <input type="number" inputMode="numeric" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                    </label>
                    <label>
                    <span>Mínimo</span>
                    <input type="number" inputMode="numeric" min="0" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
                    </label>
                    <label className="switch">
                    <input type="checkbox" checked={!!form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                    <span>Activo</span>
                    </label>
                </div>
                </div>
                <div className="modal-footer">
                <button className="btn" onClick={cerrarModal}>Cancelar</button>
                <button className="btn primary" onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear producto'}</button>
                </div>
            </div>
            </div>
        )}
        </div>
    );
    };

export default Inventario;
