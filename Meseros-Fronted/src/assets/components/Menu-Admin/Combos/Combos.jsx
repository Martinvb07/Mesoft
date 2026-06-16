import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    HiOutlineSquaresPlus,
    HiOutlineCube,
    HiOutlineBanknotes,
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineCheck,
    HiXMark,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import { logAudit } from '../../../../utils/audit';

const COMBOS_KEY = 'mesoft_combos_v1';

function loadCombos() {
    try { return JSON.parse(localStorage.getItem(COMBOS_KEY) || '[]'); } catch { return []; }
}
function saveCombos(list) {
    try { localStorage.setItem(COMBOS_KEY, JSON.stringify(list)); } catch {}
}

const emptyForm = { nombre: '', descripcion: '', precio_combo: '', productos_ids: [] };

export function getCombosFromStorage() { return loadCombos(); }

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const fmtCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
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

function Chip({ children, tone = 'slate' }) {
    const tones = {
        slate: 'bg-slate-100 text-slate-500',
        orange: 'bg-orange-50 text-orange-600',
        emerald: 'bg-emerald-50 text-emerald-600',
    };
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function MetricCard({ icon: Icon, value, label, chip }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500">
                    <Icon className="h-5 w-5 text-orange-500 transition-colors duration-300 group-hover:text-white" />
                </span>
                {chip}
            </div>
            <p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}

function Modal({ title, onClose, children, footer, maxW = 'max-w-xl' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-combos flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
            >
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

function Combos() {
    const [combos, setCombos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formMsg, setFormMsg] = useState('');
    const [search, setSearch] = useState('');
    const [prodSearch, setProdSearch] = useState('');

    useEffect(() => {
        setCombos(loadCombos());
        api.getProductos().then(r => {
            const arr = Array.isArray(r?.items) ? r.items : (Array.isArray(r) ? r : []);
            setProductos(arr);
        }).catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return combos;
        return combos.filter(c =>
            c.nombre.toLowerCase().includes(q) || (c.descripcion || '').toLowerCase().includes(q)
        );
    }, [combos, search]);

    const abrirCrear = () => {
        setForm(emptyForm);
        setFormMode('create');
        setEditId(null);
        setFormMsg('');
        setProdSearch('');
        setFormOpen(true);
    };

    const abrirEditar = (combo) => {
        setForm({
            nombre: combo.nombre,
            descripcion: combo.descripcion || '',
            precio_combo: String(combo.precio_combo || ''),
            productos_ids: combo.productos_ids || [],
        });
        setFormMode('edit');
        setEditId(combo.id);
        setFormMsg('');
        setProdSearch('');
        setFormOpen(true);
    };

    const cerrar = () => setFormOpen(false);

    const guardar = () => {
        if (!form.nombre.trim()) { setFormMsg('El nombre es obligatorio.'); return; }
        const precio = Number(form.precio_combo);
        if (!precio || precio <= 0) { setFormMsg('El precio debe ser mayor que 0.'); return; }
        if (!form.productos_ids.length) { setFormMsg('Selecciona al menos un producto.'); return; }

        const list = loadCombos();
        if (formMode === 'create') {
            const nuevo = {
                id: Date.now(),
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim(),
                precio_combo: precio,
                productos_ids: form.productos_ids,
                created_at: new Date().toISOString(),
            };
            const updated = [...list, nuevo];
            saveCombos(updated);
            setCombos(updated);
            logAudit(null, 'crear_combo', `${nuevo.nombre} — $${precio}`);
        } else {
            const updated = list.map(c => c.id === editId
                ? { ...c, nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio_combo: precio, productos_ids: form.productos_ids }
                : c
            );
            saveCombos(updated);
            setCombos(updated);
            logAudit(null, 'editar_combo', form.nombre.trim());
        }
        cerrar();
    };

    const eliminar = (combo) => {
        if (!window.confirm(`Eliminar combo "${combo.nombre}"?`)) return;
        const updated = loadCombos().filter(c => c.id !== combo.id);
        saveCombos(updated);
        setCombos(updated);
        logAudit(null, 'eliminar_combo', combo.nombre);
    };

    const toggleProducto = (prodId) => {
        setForm(prev => {
            const ids = prev.productos_ids.includes(prodId)
                ? prev.productos_ids.filter(id => id !== prodId)
                : [...prev.productos_ids, prodId];
            return { ...prev, productos_ids: ids };
        });
    };

    const isSelected = (p) => form.productos_ids.includes(p.id) || form.productos_ids.includes(String(p.id));

    const getProductoNombres = (ids) => {
        return (ids || []).map(id => {
            const p = productos.find(p => p.id === id || String(p.id) === String(id));
            return p ? p.nombre : `#${id}`;
        });
    };

    const productosFiltrados = useMemo(() => {
        const q = prodSearch.trim().toLowerCase();
        if (!q) return productos;
        return productos.filter(p => `${p.nombre || ''}`.toLowerCase().includes(q));
    }, [productos, prodSearch]);

    // Métricas
    const precioPromedio = combos.length
        ? Math.round(combos.reduce((s, c) => s + Number(c.precio_combo || 0), 0) / combos.length)
        : 0;

    return (
        <div className="ms-combos mx-auto max-w-7xl">
            <style>{`:where(.ms-combos) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Carta</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Combos · Menú del día</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Agrupa productos en combos con precio especial</p>
                </div>
                <button className={btnPrimary} onClick={abrirCrear}>
                    <HiOutlinePlus className="h-4 w-4" /> Nuevo combo
                </button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineSquaresPlus} value={combos.length} label="Combos activos" chip={<Chip tone="orange">Carta</Chip>} />
                <MetricCard icon={HiOutlineCube} value={productos.length} label="Productos disponibles" />
                <MetricCard icon={HiOutlineBanknotes} value={fmtCOP(precioPromedio)} label="Precio promedio" chip={<Chip tone="emerald">Combo</Chip>} />
            </motion.div>

            {/* Toolbar: búsqueda */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase}`}
            >
                <div className="relative sm:max-w-sm">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar combos…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </motion.div>

            {/* Grid de combos */}
            {filtered.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineSquaresPlus className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">{combos.length === 0 ? 'No hay combos creados aún. Crea el primero.' : 'Sin resultados para la búsqueda.'}</p>
                        {combos.length === 0 && (
                            <button className={`${btnPrimary} mt-2`} onClick={abrirCrear}><HiOutlinePlus className="h-4 w-4" /> Nuevo combo</button>
                        )}
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={gridStagger}
                    initial="hidden"
                    animate="visible"
                    className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {filtered.map(combo => {
                        const nombres = getProductoNombres(combo.productos_ids);
                        return (
                            <motion.div
                                key={combo.id}
                                variants={itemUp}
                                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200"
                            >
                                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />

                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                            <HiOutlineSquaresPlus className="h-5 w-5" />
                                        </span>
                                        <p className="m-0 truncate text-base font-extrabold tracking-tight text-slate-900">{combo.nombre}</p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-sm font-extrabold text-orange-600">
                                        {fmtCOP(combo.precio_combo)}
                                    </span>
                                </div>

                                {combo.descripcion && (
                                    <p className="m-0 mt-3 line-clamp-2 text-sm text-slate-500">{combo.descripcion}</p>
                                )}

                                <div className="mt-3 flex-1">
                                    <p className="m-0 mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{nombres.length} producto{nombres.length !== 1 ? 's' : ''}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {nombres.length === 0 ? (
                                            <span className="text-sm text-slate-400">Sin productos</span>
                                        ) : (
                                            nombres.slice(0, 5).map((n, i) => (
                                                <span key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{n}</span>
                                            ))
                                        )}
                                        {nombres.length > 5 && (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">+{nombres.length - 5}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                                    <button
                                        onClick={() => abrirEditar(combo)}
                                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <HiOutlinePencilSquare className="h-4 w-4" /> Editar
                                    </button>
                                    <button
                                        onClick={() => eliminar(combo)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50"
                                    >
                                        <HiOutlineTrash className="h-4 w-4" /> Eliminar
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Modal crear/editar */}
            {formOpen && (
                <Modal
                    title={formMode === 'create' ? 'Nuevo combo' : 'Editar combo'}
                    onClose={cerrar}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrar}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardar}>{formMode === 'create' ? 'Crear combo' : 'Guardar cambios'}</button>
                        </>
                    }
                >
                    {formMsg && (
                        <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 ring-1 ring-red-100">{formMsg}</div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Nombre del combo</label>
                            <input className={inputCls} value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Combo Almuerzo" />
                        </div>
                        <div>
                            <label className={labelCls}>Descripción (opcional)</label>
                            <textarea className={`${inputCls} resize-y`} rows={2} value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del combo…" />
                        </div>
                        <div>
                            <label className={labelCls}>Precio del combo</label>
                            <input type="number" min={0} className={inputCls} value={form.precio_combo} onChange={e => setForm(p => ({ ...p, precio_combo: e.target.value }))} placeholder="Precio especial del combo" />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className={`${labelCls} mb-0`}>Productos incluidos</label>
                                {form.productos_ids.length > 0 && <Chip tone="orange">{form.productos_ids.length} sel.</Chip>}
                            </div>
                            {productos.length === 0 ? (
                                <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-400 ring-1 ring-slate-100">No hay productos disponibles.</div>
                            ) : (
                                <>
                                    <div className="relative mb-2">
                                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            value={prodSearch}
                                            onChange={e => setProdSearch(e.target.value)}
                                            placeholder="Buscar producto…"
                                            className="w-full rounded-xl border-0 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                                        />
                                    </div>
                                    <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl bg-slate-50/60 p-2 ring-1 ring-slate-100 sm:grid-cols-2">
                                        {productosFiltrados.map(p => {
                                            const selected = isSelected(p);
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => toggleProducto(p.id)}
                                                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ring-1 transition-colors ${selected ? 'bg-orange-50 text-orange-700 ring-orange-200' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    <span className="truncate">{p.nombre}</span>
                                                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md ${selected ? 'bg-orange-500 text-white' : 'ring-1 ring-slate-300'}`}>
                                                        {selected && <HiOutlineCheck className="h-3 w-3" />}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        {productosFiltrados.length === 0 && (
                                            <div className="col-span-full px-3 py-3 text-center text-sm text-slate-400">Sin coincidencias.</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Combos;
