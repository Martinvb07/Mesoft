import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { HiCube, HiCheckCircle, HiExclamationTriangle, HiCurrencyDollar, HiBanknotes, HiXMark } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Finanzas/Inventario.css';
import { api } from '../../../../api/client';
import { logAudit } from '../../../../utils/audit';

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

function seedIfEmpty(list) { return Array.isArray(list) ? list : []; }

const Inventario = () => {
    // Estado principal
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [fCategoria, setFCategoria] = useState('todas');
    const [fEstado, setFEstado] = useState('todos'); // todos | activos | inactivos
    const [sort, setSort] = useState({ by: 'nombre', dir: 'asc' });

    // Modal estado
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ sku: '', nombre: '', categoria: '', costo: '', precio: '', stock: '', minStock: '', activo: true, imagen: '' });
    const [ingredientes, setIngredientes] = useState([]);
    const [showIngredientes, setShowIngredientes] = useState(false);

    // CSV import state
    const [showCsvModal, setShowCsvModal] = useState(false);
    const [csvRows, setCsvRows] = useState([]);
    const [csvFile, setCsvFile] = useState('');
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvResult, setCsvResult] = useState(null);
    const csvInputRef = React.useRef(null);

    useEffect(() => { safeWrite(LS_KEY, productos); }, [productos]);

    // Cargar desde backend si está disponible
    useEffect(() => {
        let mounted = true;
        (async () => {
            setCargando(true);
            try {
                const resp = await api.getProductos();
                const list = Array.isArray(resp?.items) ? resp.items : Array.isArray(resp) ? resp : [];
                const mapped = list.map(r => ({
                    id: r.id,
                    sku: r.sku || `SKU-${r.id}`,
                    nombre: r.nombre,
                    categoria: r.categoria || '',
                    costo: r.costo ?? 0,
                    precio: r.precio ?? 0,
                    stock: r.stock ?? 0,
                    minStock: r.minStock ?? r.min_stock ?? 0,
                    activo: r.activo ?? true,
                    imagen: r.imagen ?? '',
                    ingredientes: Array.isArray(r.ingredientes) ? r.ingredientes : [],
                    costo_receta: r.costo_receta ?? 0,
                    createdAt: r.createdAt || r.created_at || nowIso(),
                    updatedAt: r.updatedAt || r.updated_at || nowIso(),
                }));
                if (mounted) setProductos(mapped);
            } catch (e) {
                console.error('[inventario] error cargando desde backend:', e?.message || e);
            } finally { setCargando(false); }
        })();
        return () => { mounted = false; };
    }, []);

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
        setForm({ sku: '', nombre: '', categoria: '', costo: '', precio: '', stock: '', minStock: '', activo: true, imagen: '' });
        setIngredientes([]);
        setShowIngredientes(false);
        setShowModal(true);
    };
    const abrirEditar = (id) => {
        const p = productos.find(x => x.id === id);
        if (!p) return;
        setEditId(id);
        setForm({ sku: p.sku, nombre: p.nombre, categoria: p.categoria || '', costo: String(p.costo), precio: String(p.precio), stock: String(p.stock), minStock: String(p.minStock), activo: !!p.activo, imagen: p.imagen || '' });
        setIngredientes(Array.isArray(p.ingredientes) ? p.ingredientes : []);
        setShowIngredientes(Array.isArray(p.ingredientes) && p.ingredientes.length > 0);
        setShowModal(true);
    };

    // Calcular costo_receta desde ingredientes
    const costoReceta = ingredientes.reduce((s, ing) => s + (Number(ing.cantidad || 0) * Number(ing.costo_unitario || 0)), 0);
    const agregarIngrediente = () => setIngredientes(prev => [...prev, { nombre: '', cantidad: 1, unidad: '', costo_unitario: 0 }]);
    const quitarIngrediente = (idx) => setIngredientes(prev => prev.filter((_, i) => i !== idx));
    const editIngrediente = (idx, field, value) => setIngredientes(prev => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));

    // Sincronizar costo con costo_receta cuando se editan ingredientes
    React.useEffect(() => {
        if (ingredientes.length > 0 && costoReceta > 0) {
            setForm(f => ({ ...f, costo: String(costoReceta.toFixed(2)) }));
        }
    }, [costoReceta]);

    // CSV helpers
    const parseCsv = (text) => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        return lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const row = {};
            headers.forEach((h, i) => { row[h] = cols[i] || ''; });
            return row;
        }).filter(r => r.nombre || r.sku);
    };

    const handleCsvFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const rows = parseCsv(text);
        setCsvRows(rows);
        setCsvResult(null);
    };

    const downloadCsvTemplate = () => {
        const csv = 'sku,nombre,categoria,precio,costo,stock,minStock\nSKU-01,Producto Ejemplo,Bebidas,5000,2000,100,10';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'plantilla_importacion.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const importarCsv = async () => {
        if (!csvRows.length) return;
        setCsvImporting(true);
        try {
            const res = await api.importarProductosCSV(csvRows);
            setCsvResult(res);
            if (res?.creados > 0) {
                // Recargar productos
                const resp = await api.getProductos();
                const list = Array.isArray(resp?.items) ? resp.items : Array.isArray(resp) ? resp : [];
                setProductos(list.map(r => ({
                    id: r.id, sku: r.sku || `SKU-${r.id}`, nombre: r.nombre, categoria: r.categoria || '',
                    costo: r.costo ?? 0, precio: r.precio ?? 0, stock: r.stock ?? 0, minStock: r.minStock ?? r.min_stock ?? 0,
                    activo: r.activo ?? true, imagen: r.imagen ?? '', createdAt: r.createdAt || nowIso(), updatedAt: r.updatedAt || nowIso(),
                    ingredientes: r.ingredientes || [],
                })));
            }
        } catch (e) {
            Swal.fire('Error', e?.message || 'No se pudo importar', 'error');
        }
        setCsvImporting(false);
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
        const imagen = (form.imagen || '').trim() || null;

        if (!sku) return Swal.fire({ icon: 'error', title: 'SKU requerido' });
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Nombre requerido' });
        if (skuExiste(sku, editId)) return Swal.fire({ icon: 'error', title: 'SKU duplicado' });
        if (precio < 0 || costo < 0) return Swal.fire({ icon: 'error', title: 'Precios y costos no pueden ser negativos' });
        if (precio < costo) {
        const res = await Swal.fire({ icon: 'warning', title: 'Precio menor que el costo', text: '¿Deseas continuar de todos modos?', showCancelButton: true, confirmButtonText: 'Sí, continuar', cancelButtonText: 'Cancelar' });
        if (!res.isConfirmed) return;
    }

    const ingredientesClean = ingredientes.filter(ing => ing.nombre?.trim());
    const costoRecetaFinal = ingredientesClean.reduce((s, ing) => s + (Number(ing.cantidad || 0) * Number(ing.costo_unitario || 0)), 0);
    const costoFinal = ingredientesClean.length > 0 ? costoRecetaFinal : costo;

    try {
        if (editId) {
            // Intentar en backend
            try {
                await api.actualizarProducto(editId, {
                    sku, nombre, categoria, costo: costoFinal, precio, stock, minStock, activo, imagen,
                    descripcion: categoria,
                    ingredientes: ingredientesClean,
                });
            } catch {}
            setProductos(prev => prev.map(p => p.id === editId ? {
                ...p, sku, nombre, categoria, costo: costoFinal, precio, stock, minStock, activo, imagen,
                ingredientes: ingredientesClean, costo_receta: costoRecetaFinal, updatedAt: nowIso(),
            } : p));
            logAudit(null, 'editar_producto', `${nombre} (SKU: ${sku})`);
            Swal.fire({ icon: 'success', title: 'Producto actualizado', timer: 900, showConfirmButton: false });
        } else {
            let created = null;
            try {
                created = await api.crearProducto({
                    sku, nombre, categoria, costo: costoFinal, precio, stock, minStock, activo, imagen,
                    descripcion: categoria,
                });
            } catch {}
            const nuevo = {
                id: created?.id || crypto.randomUUID?.() || String(Date.now()),
                sku, nombre, categoria, costo: costoFinal, precio, stock, minStock, activo, imagen,
                ingredientes: ingredientesClean, costo_receta: costoRecetaFinal,
                createdAt: nowIso(), updatedAt: nowIso(),
            };
            setProductos(prev => [nuevo, ...prev]);
            logAudit(null, 'crear_producto', `${nombre} (SKU: ${sku})`);
            Swal.fire({ icon: 'success', title: 'Producto creado', timer: 900, showConfirmButton: false });
        }
    } finally {
        setShowModal(false);
    }
    };

    const eliminar = async (id) => {
        const p = productos.find(x => x.id === id);
        if (!p) return;
        const res = await Swal.fire({ title: `Eliminar ${p.nombre}`, text: `Se eliminará el producto SKU ${p.sku}. Esta acción no se puede deshacer.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#ef4444' });
        if (!res.isConfirmed) return;
    try { await api.eliminarProducto(id); } catch {}
        setProductos(prev => prev.filter(x => x.id !== id));
        logAudit(null, 'eliminar_producto', `${p.nombre} (SKU: ${p.sku})`);
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
                <button className="btn" onClick={() => { setShowCsvModal(true); setCsvRows([]); setCsvResult(null); }}>Importar CSV</button>
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
            </div>
            </div>

            {cargando ? (
            <div className="empty">Cargando inventario…</div>
            ) : filtered.length === 0 ? (
            <div className="empty">No se encontraron productos con los filtros actuales.</div>
            ) : (
            <div className="table-wrap">
                <table className="table">
                <thead>
                    <tr>
                    <th>Img</th>
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
                        <td>
                            {p.imagen ? (
                                <img src={p.imagen} alt={p.nombre} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4, border: '1px solid #eef2f6' }} onError={e => { e.target.style.display='none'; }} />
                            ) : (
                                <span style={{ display:'inline-block', width:30, height:30, background:'#f3f4f6', borderRadius:4, lineHeight:'30px', textAlign:'center', fontSize:'.7rem', color:'#9ca3af' }}>–</span>
                            )}
                        </td>
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
                    <label style={{ gridColumn: '1/-1' }}>
                    <span>URL de imagen (opcional)</span>
                    <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                        <input
                            type="url"
                            value={form.imagen}
                            onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            style={{ flex: 1 }}
                        />
                        {form.imagen && (
                            <img
                                src={form.imagen}
                                alt="preview"
                                style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4, border: '1px solid #eef2f6', flexShrink: 0 }}
                                onError={e => { e.target.style.display='none'; }}
                            />
                        )}
                    </div>
                    </label>
                    <label className="switch">
                    <input type="checkbox" checked={!!form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                    <span>Activo</span>
                    </label>
                </div>

                {/* Receta / Ingredientes */}
                <div style={{ marginTop: '1rem' }}>
                    <button
                        type="button"
                        className="btn ghost"
                        style={{ fontSize: '.875rem', marginBottom: '.5rem' }}
                        onClick={() => setShowIngredientes(v => !v)}
                    >
                        {showIngredientes ? '▼' : '▶'} Receta / Ingredientes
                    </button>
                    {showIngredientes && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '.75rem' }}>
                            <table style={{ width: '100%', fontSize: '.85rem', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb' }}>
                                        <th style={{ padding: '.4rem', textAlign: 'left' }}>Ingrediente</th>
                                        <th style={{ padding: '.4rem', textAlign: 'right' }}>Cantidad</th>
                                        <th style={{ padding: '.4rem', textAlign: 'left' }}>Unidad</th>
                                        <th style={{ padding: '.4rem', textAlign: 'right' }}>Costo unit.</th>
                                        <th style={{ padding: '.4rem', textAlign: 'right' }}>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ingredientes.map((ing, idx) => (
                                        <tr key={idx}>
                                            <td style={{ padding: '.3rem' }}>
                                                <input
                                                    value={ing.nombre}
                                                    onChange={e => editIngrediente(idx, 'nombre', e.target.value)}
                                                    placeholder="Ej. Harina"
                                                    style={{ width: '100%', padding: '.25rem .4rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '.85rem' }}
                                                />
                                            </td>
                                            <td style={{ padding: '.3rem' }}>
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    value={ing.cantidad}
                                                    onChange={e => editIngrediente(idx, 'cantidad', e.target.value)}
                                                    style={{ width: 70, padding: '.25rem .4rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '.85rem', textAlign: 'right' }}
                                                />
                                            </td>
                                            <td style={{ padding: '.3rem' }}>
                                                <input
                                                    value={ing.unidad}
                                                    onChange={e => editIngrediente(idx, 'unidad', e.target.value)}
                                                    placeholder="kg, g, ml..."
                                                    style={{ width: 60, padding: '.25rem .4rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '.85rem' }}
                                                />
                                            </td>
                                            <td style={{ padding: '.3rem' }}>
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    value={ing.costo_unitario}
                                                    onChange={e => editIngrediente(idx, 'costo_unitario', e.target.value)}
                                                    style={{ width: 80, padding: '.25rem .4rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '.85rem', textAlign: 'right' }}
                                                />
                                            </td>
                                            <td style={{ padding: '.3rem', textAlign: 'right', color: '#374151' }}>
                                                {toCurrency(Number(ing.cantidad || 0) * Number(ing.costo_unitario || 0))}
                                            </td>
                                            <td style={{ padding: '.3rem' }}>
                                                <button
                                                    type="button"
                                                    className="btn sm danger"
                                                    onClick={() => quitarIngrediente(idx)}
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={4} style={{ padding: '.4rem', textAlign: 'right', fontWeight: 600 }}>Costo receta:</td>
                                        <td style={{ padding: '.4rem', textAlign: 'right', fontWeight: 700, color: '#ff6633' }}>{toCurrency(costoReceta)}</td>
                                        <td></td>
                                    </tr>
                                    {parseNum(form.precio) > 0 && costoReceta > 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '.4rem', textAlign: 'right', fontSize: '.82rem', color: '#6b7280' }}>Margen real:</td>
                                            <td style={{ padding: '.4rem', textAlign: 'right', fontSize: '.82rem', fontWeight: 600, color: '#16a34a' }}>
                                                {(((parseNum(form.precio) - costoReceta) / parseNum(form.precio)) * 100).toFixed(1)}%
                                            </td>
                                            <td></td>
                                        </tr>
                                    )}
                                </tfoot>
                            </table>
                            <button type="button" className="btn ghost" style={{ marginTop: '.5rem', fontSize: '.85rem' }} onClick={agregarIngrediente}>
                                + Agregar ingrediente
                            </button>
                        </div>
                    )}
                </div>
                </div>
                <div className="modal-footer">
                <button className="btn" onClick={cerrarModal}>Cancelar</button>
                <button className="btn primary" onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear producto'}</button>
                </div>
            </div>
            </div>
        )}

        {/* CSV Import Modal */}
        {showCsvModal && (
            <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-card lg">
                    <div className="modal-header">
                        <h3>Importar productos desde CSV</h3>
                        <button className="icon-btn" onClick={() => setShowCsvModal(false)} aria-label="Cerrar"><HiXMark /></button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                            <button className="btn ghost" onClick={downloadCsvTemplate}>Descargar plantilla CSV</button>
                            <span style={{ color: '#6b7280', fontSize: '.85rem' }}>Columnas: sku, nombre, categoria, precio, costo, stock, minStock</span>
                        </div>
                        <div>
                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                style={{ display: 'none' }}
                                onChange={handleCsvFile}
                            />
                            <button className="btn primary" onClick={() => csvInputRef.current?.click()}>Seleccionar archivo CSV</button>
                        </div>
                        {csvRows.length > 0 && (
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '.4rem', fontSize: '.9rem' }}>
                                    Vista previa — {csvRows.length} filas detectadas (mostrando primeras 5):
                                </div>
                                <div className="table-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                {Object.keys(csvRows[0]).map(h => <th key={h}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvRows.slice(0, 5).map((row, idx) => (
                                                <tr key={idx}>
                                                    {Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {csvResult && (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '.75rem', fontSize: '.9rem' }}>
                                <strong>{csvResult.creados}</strong> creados, <strong>{csvResult.duplicados}</strong> duplicados ignorados.
                                {csvResult.errores?.length > 0 && (
                                    <div style={{ color: '#ef4444', marginTop: '.35rem', fontSize: '.82rem' }}>
                                        Errores: {csvResult.errores.join('; ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn" onClick={() => setShowCsvModal(false)}>Cerrar</button>
                        {csvRows.length > 0 && (
                            <button className="btn primary" onClick={importarCsv} disabled={csvImporting}>
                                {csvImporting ? 'Importando…' : `Importar ${csvRows.length} productos`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
        </div>
    );
    };

export default Inventario;
