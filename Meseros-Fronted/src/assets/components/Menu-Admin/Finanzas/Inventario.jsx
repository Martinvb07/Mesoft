import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineCube, HiOutlineCheckCircle, HiOutlineExclamationTriangle, HiOutlineCurrencyDollar,
    HiOutlineBanknotes, HiXMark, HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineArrowUpTray,
    HiOutlineArrowDownTray, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowsUpDown,
    HiOutlineChevronDown, HiOutlineArrowDownTray as HiDownload,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import { logAudit } from '../../../../utils/audit';
import Select from '../../ui/Select';

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

function safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* noop */ }
}

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function MetricCard({ icon: Icon, value, label }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
            </div>
            <p className="mt-4 text-xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

function Modal({ title, onClose, children, footer, maxW = 'max-w-3xl' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-inv flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
            >
                <style>{`:where(.ms-inv) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                        <HiXMark className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
            </motion.div>
        </div>
    );
}

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
            } finally { if (mounted) setCargando(false); }
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
        const headers = ['SKU', 'Nombre', 'Categoria', 'Costo', 'Precio', 'Stock', 'MinStock', 'Activo', 'Creado', 'Actualizado'];
        const rows = productos.map(p => [p.sku, p.nombre, p.categoria || '', p.costo, p.precio, p.stock, p.minStock, p.activo ? 'Sí' : 'No', p.createdAt, p.updatedAt]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const toggleSort = (by) => {
        setSort(prev => {
            if (prev.by === by) return { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            return { by, dir: 'asc' };
        });
    };

    const SortTh = ({ by, children, right, center }) => (
        <th
            onClick={by ? () => toggleSort(by) : undefined}
            className={`select-none px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${by ? 'cursor-pointer hover:text-slate-600' : ''} ${right ? 'text-right' : center ? 'text-center' : 'text-left'}`}
        >
            <span className={`inline-flex items-center gap-1 ${right ? 'justify-end' : center ? 'justify-center' : ''}`}>
                {children}
                {by && <HiOutlineArrowsUpDown className={`h-3 w-3 ${sort.by === by ? 'text-orange-500' : 'opacity-40'}`} />}
            </span>
        </th>
    );

    return (
        <div className="ms-inv mx-auto max-w-7xl">
            <style>{`:where(.ms-inv) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Finanzas</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Inventario</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Productos, stock y valoraciones</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className={btnGhost} onClick={() => { setShowCsvModal(true); setCsvRows([]); setCsvResult(null); }}><HiOutlineArrowUpTray className="h-4 w-4" /> Importar CSV</button>
                    <button className={btnGhost} onClick={exportarCSV}><HiOutlineArrowDownTray className="h-4 w-4" /> Exportar CSV</button>
                    <button className={btnPrimary} onClick={abrirNuevo}><HiOutlinePlus className="h-4 w-4" /> Nuevo producto</button>
                </div>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
            >
                <MetricCard icon={HiOutlineCube} value={metrics.total} label="Productos" />
                <MetricCard icon={HiOutlineCheckCircle} value={metrics.activos} label="Activos" />
                <MetricCard icon={HiOutlineExclamationTriangle} value={metrics.bajos} label="Bajo stock" />
                <MetricCard icon={HiOutlineCurrencyDollar} value={toCurrency(metrics.valorCosto)} label="Valor al costo" />
                <MetricCard icon={HiOutlineBanknotes} value={toCurrency(metrics.valorVenta)} label="Valor a venta" />
            </motion.div>

            {/* Toolbar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
            >
                <div className="relative sm:max-w-xs sm:flex-1">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar SKU, nombre, categoría…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select className="min-w-[180px]" value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
                        <option value="todas">Todas las categorías</option>
                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Select className="min-w-[140px]" value={fEstado} onChange={e => setFEstado(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="activos">Activos</option>
                        <option value="inactivos">Inactivos</option>
                    </Select>
                </div>
            </motion.div>

            {/* Tabla */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                className={`mt-5 ${cardBase} overflow-hidden p-0`}
            >
                {cargando ? (
                    <div className="space-y-3 p-5">{[...Array(6)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineCube className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">No se encontraron productos con los filtros actuales.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <SortTh>Img</SortTh>
                                    <SortTh by="sku">SKU</SortTh>
                                    <SortTh by="nombre">Nombre</SortTh>
                                    <SortTh by="categoria">Categoría</SortTh>
                                    <SortTh by="stock" right>Stock</SortTh>
                                    <SortTh by="minStock" right>Mín</SortTh>
                                    <SortTh by="costo" right>Costo</SortTh>
                                    <SortTh by="precio" right>Precio</SortTh>
                                    <SortTh center>Margen</SortTh>
                                    <SortTh center>Estado</SortTh>
                                    <SortTh right>Acciones</SortTh>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(p => {
                                    const margen = p.precio > 0 ? ((p.precio - p.costo) / p.precio) : 0;
                                    const bajo = p.stock <= p.minStock;
                                    const margenTone = margen >= 0.35 ? 'bg-emerald-50 text-emerald-700' : margen >= 0.15 ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700';
                                    return (
                                        <tr key={p.id} className={`border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60 ${!p.activo ? 'opacity-60' : ''}`}>
                                            <td className="px-3 py-2.5">
                                                {p.imagen ? (
                                                    <img src={p.imagen} alt={p.nombre} className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-100" onError={e => { e.target.style.display = 'none'; }} />
                                                ) : (
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-sm font-medium text-slate-500">{p.sku}</td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{p.nombre}</td>
                                            <td className="px-3 py-2.5 text-sm text-slate-500">{p.categoria || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-sm text-slate-700">
                                                <span className="inline-flex items-center gap-1.5">
                                                    {p.stock}
                                                    {bajo && <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">Bajo</span>}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-sm text-slate-400">{p.minStock}</td>
                                            <td className="px-3 py-2.5 text-right text-sm text-slate-700">{toCurrency(p.costo)}</td>
                                            <td className="px-3 py-2.5 text-right text-sm font-semibold text-slate-900">{toCurrency(p.precio)}</td>
                                            <td className="px-3 py-2.5 text-center">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${margenTone}`}>{(margen * 100).toFixed(0)}%</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${p.activo ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${p.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} /> {p.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => abrirEditar(p.id)} title="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900">
                                                        <HiOutlinePencilSquare className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => eliminar(p.id)} title="Eliminar" className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50">
                                                        <HiOutlineTrash className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Modal crear/editar producto */}
            {showModal && (
                <Modal
                    title={editId ? 'Editar producto' : 'Nuevo producto'}
                    onClose={cerrarModal}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrarModal}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear producto'}</button>
                        </>
                    }
                >
                    <p className="m-0 mb-4 text-sm text-slate-500">Completa los datos del producto. Los campos marcados con <span className="font-bold text-orange-500">*</span> son obligatorios.</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls}>SKU *</label>
                            <input className={inputCls} value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ej. CAF-ESP-01" />
                        </div>
                        <div>
                            <label className={labelCls}>Nombre *</label>
                            <input className={inputCls} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Café Espresso" />
                        </div>
                        <div>
                            <label className={labelCls}>Categoría</label>
                            <input list="cat-list" className={inputCls} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} placeholder="Ej. Bebidas" />
                            <datalist id="cat-list">{categorias.map(c => <option key={c} value={c} />)}</datalist>
                        </div>
                        <div>
                            <label className={labelCls}>Costo</label>
                            <input type="number" inputMode="decimal" min="0" className={inputCls} value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Precio</label>
                            <input type="number" inputMode="decimal" min="0" className={inputCls} value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Stock</label>
                            <input type="number" inputMode="numeric" min="0" className={inputCls} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Stock mínimo</label>
                            <input type="number" inputMode="numeric" min="0" className={inputCls} value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
                        </div>
                        <div>
                            <label className={labelCls}>Estado</label>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold ring-1 transition-colors ${form.activo ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-50 text-slate-500 ring-slate-200'}`}
                            >
                                {form.activo ? 'Activo' : 'Inactivo'}
                                <span className={`relative h-5 w-9 rounded-full transition-colors ${form.activo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${form.activo ? 'left-[18px]' : 'left-0.5'}`} />
                                </span>
                            </button>
                        </div>
                        <div className="sm:col-span-2">
                            <label className={labelCls}>URL de imagen (opcional)</label>
                            <div className="flex items-center gap-2">
                                <input type="url" className={inputCls} value={form.imagen} onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))} placeholder="https://ejemplo.com/imagen.jpg" />
                                {form.imagen && <img src={form.imagen} alt="preview" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-100" onError={e => { e.target.style.display = 'none'; }} />}
                            </div>
                        </div>
                    </div>

                    {/* Receta / Ingredientes */}
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => setShowIngredientes(v => !v)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                        >
                            <HiOutlineChevronDown className={`h-4 w-4 transition-transform ${showIngredientes ? 'rotate-180' : ''}`} /> Receta / Ingredientes
                        </button>
                        {showIngredientes && (
                            <div className="mt-3 rounded-xl bg-slate-50/60 p-3 ring-1 ring-slate-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                                <th className="px-2 py-1.5 text-left">Ingrediente</th>
                                                <th className="px-2 py-1.5 text-right">Cant.</th>
                                                <th className="px-2 py-1.5 text-left">Unidad</th>
                                                <th className="px-2 py-1.5 text-right">Costo unit.</th>
                                                <th className="px-2 py-1.5 text-right">Subtotal</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ingredientes.map((ing, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-1 py-1"><input value={ing.nombre} onChange={e => editIngrediente(idx, 'nombre', e.target.value)} placeholder="Ej. Harina" className="w-full rounded-lg border-0 bg-white px-2 py-1.5 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-orange-400" /></td>
                                                    <td className="px-1 py-1"><input type="number" min="0" step="0.01" value={ing.cantidad} onChange={e => editIngrediente(idx, 'cantidad', e.target.value)} className="w-20 rounded-lg border-0 bg-white px-2 py-1.5 text-right text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-orange-400" /></td>
                                                    <td className="px-1 py-1"><input value={ing.unidad} onChange={e => editIngrediente(idx, 'unidad', e.target.value)} placeholder="kg, g…" className="w-16 rounded-lg border-0 bg-white px-2 py-1.5 text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-orange-400" /></td>
                                                    <td className="px-1 py-1"><input type="number" min="0" step="0.01" value={ing.costo_unitario} onChange={e => editIngrediente(idx, 'costo_unitario', e.target.value)} className="w-24 rounded-lg border-0 bg-white px-2 py-1.5 text-right text-sm ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-orange-400" /></td>
                                                    <td className="px-2 py-1 text-right text-slate-600">{toCurrency(Number(ing.cantidad || 0) * Number(ing.costo_unitario || 0))}</td>
                                                    <td className="px-1 py-1 text-right"><button type="button" onClick={() => quitarIngrediente(idx)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50"><HiXMark className="h-4 w-4" /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-slate-200">
                                                <td colSpan={4} className="px-2 py-2 text-right text-sm font-bold text-slate-600">Costo receta:</td>
                                                <td className="px-2 py-2 text-right text-sm font-extrabold text-orange-600">{toCurrency(costoReceta)}</td>
                                                <td />
                                            </tr>
                                            {parseNum(form.precio) > 0 && costoReceta > 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-2 py-1 text-right text-xs text-slate-500">Margen real:</td>
                                                    <td className="px-2 py-1 text-right text-xs font-bold text-emerald-600">{(((parseNum(form.precio) - costoReceta) / parseNum(form.precio)) * 100).toFixed(1)}%</td>
                                                    <td />
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>
                                </div>
                                <button type="button" onClick={agregarIngrediente} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50">
                                    <HiOutlinePlus className="h-4 w-4" /> Agregar ingrediente
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* CSV Import Modal */}
            {showCsvModal && (
                <Modal
                    title="Importar productos desde CSV"
                    onClose={() => setShowCsvModal(false)}
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => setShowCsvModal(false)}>Cerrar</button>
                            {csvRows.length > 0 && (
                                <button className={btnPrimary} onClick={importarCsv} disabled={csvImporting}>{csvImporting ? 'Importando…' : `Importar ${csvRows.length} productos`}</button>
                            )}
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                            <button className={btnGhost} onClick={downloadCsvTemplate}><HiDownload className="h-4 w-4" /> Descargar plantilla</button>
                            <span className="text-sm text-slate-400">Columnas: sku, nombre, categoria, precio, costo, stock, minStock</span>
                        </div>
                        <div>
                            <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFile} />
                            <button className={btnPrimary} onClick={() => csvInputRef.current?.click()}><HiOutlineArrowUpTray className="h-4 w-4" /> Seleccionar archivo CSV</button>
                        </div>
                        {csvRows.length > 0 && (
                            <div>
                                <p className="m-0 mb-2 text-sm font-semibold text-slate-700">Vista previa — {csvRows.length} filas (primeras 5):</p>
                                <div className="max-h-52 overflow-auto rounded-xl ring-1 ring-slate-100">
                                    <table className="w-full border-collapse text-sm">
                                        <thead className="bg-slate-50">
                                            <tr className="border-b border-slate-100">
                                                {Object.keys(csvRows[0]).map(h => <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-400">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvRows.slice(0, 5).map((row, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 last:border-0">
                                                    {Object.values(row).map((v, j) => <td key={j} className="px-3 py-2 text-slate-600">{String(v)}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {csvResult && (
                            <div className="rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-700 ring-1 ring-emerald-100">
                                <strong>{csvResult.creados}</strong> creados, <strong>{csvResult.duplicados}</strong> duplicados ignorados.
                                {csvResult.errores?.length > 0 && (
                                    <div className="mt-1 text-xs text-red-600">Errores: {csvResult.errores.join('; ')}</div>
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Inventario;
