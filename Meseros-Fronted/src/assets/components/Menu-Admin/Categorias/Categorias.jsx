import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineSquaresPlus,
    HiOutlineCube,
    HiOutlineEyeSlash,
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineArrowUp,
    HiOutlineArrowDown,
    HiOutlineCheck,
    HiXMark,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import Select from '../../ui/Select';
import ImagenUploader from '../../ui/ImagenUploader';
import { imagenTransformada } from '../../../../utils/imagen';

/* Las categorías ordenan el menú: definen los grupos que ve el mesero en el
   POS y en qué orden aparecen. El producto sigue guardando el nombre de la
   categoría, así que renombrar aquí arrastra a sus productos. */

/* Paleta cerrada de 16. El color se puede repetir entre categorías: es una
   ayuda visual, no un identificador. Debe coincidir con la del backend. */
const COLORES = [
    { key: 'orange', hex: '#f97316', chip: 'bg-orange-50 text-orange-600 ring-orange-200' },
    { key: 'sky', hex: '#0ea5e9', chip: 'bg-sky-50 text-sky-600 ring-sky-200' },
    { key: 'emerald', hex: '#10b981', chip: 'bg-emerald-50 text-emerald-600 ring-emerald-200' },
    { key: 'violet', hex: '#8b5cf6', chip: 'bg-violet-50 text-violet-600 ring-violet-200' },
    { key: 'amber', hex: '#f59e0b', chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
    { key: 'rose', hex: '#f43f5e', chip: 'bg-rose-50 text-rose-600 ring-rose-200' },
    { key: 'teal', hex: '#14b8a6', chip: 'bg-teal-50 text-teal-600 ring-teal-200' },
    { key: 'indigo', hex: '#6366f1', chip: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
    { key: 'lime', hex: '#84cc16', chip: 'bg-lime-50 text-lime-700 ring-lime-200' },
    { key: 'pink', hex: '#ec4899', chip: 'bg-pink-50 text-pink-600 ring-pink-200' },
    { key: 'cyan', hex: '#06b6d4', chip: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
    { key: 'blue', hex: '#3b82f6', chip: 'bg-blue-50 text-blue-600 ring-blue-200' },
    { key: 'fuchsia', hex: '#d946ef', chip: 'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-200' },
    { key: 'green', hex: '#22c55e', chip: 'bg-green-50 text-green-700 ring-green-200' },
    { key: 'yellow', hex: '#eab308', chip: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
    { key: 'slate', hex: '#94a3b8', chip: 'bg-slate-100 text-slate-600 ring-slate-200' },
];
const colorUI = (key) => COLORES.find(c => c.key === key) || COLORES[COLORES.length - 1];

const cardBase = 'rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60 sm:p-5';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

function MetricCard({ icon: Icon, value, label }) {
    return (
        <motion.div variants={itemUp} className={`group ${cardBase} transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-orange-200`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 transition-colors duration-300 group-hover:bg-orange-500 sm:h-11 sm:w-11 sm:rounded-xl">
                <Icon className="h-4 w-4 text-orange-500 transition-colors duration-300 group-hover:text-white sm:h-5 sm:w-5" />
            </span>
            <p className="mt-2.5 text-lg font-extrabold text-slate-900 sm:mt-4 sm:text-2xl">{value}</p>
            <p className="mt-1 text-[11px] leading-tight text-slate-400 sm:mt-0.5 sm:text-sm">{label}</p>
        </motion.div>
    );
}

function Modal({ title, onClose, children, footer, maxW = 'max-w-lg' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-categorias flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
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

const emptyForm = { nombre: '', color: 'orange', activa: true, imagen: '' };

export default function Categorias() {
    const [cats, setCats] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const [borrar, setBorrar] = useState(null); // { id, nombre, productos }
    const [destino, setDestino] = useState('');

    const cargar = async () => {
        setCargando(true);
        try {
            const data = await api.getCategorias();
            setCats(Array.isArray(data) ? data : []);
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudieron cargar las categorías', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargar(); }, []);

    const activas = useMemo(() => cats.filter(c => c.activa !== false).length, [cats]);

    const abrirNueva = () => { setEditId(null); setForm(emptyForm); setFormOpen(true); };
    const abrirEditar = (c) => {
        setEditId(c.id);
        setForm({ nombre: c.nombre || '', color: c.color || 'slate', activa: c.activa !== false, imagen: c.imagen || '' });
        setFormOpen(true);
    };

    const guardar = async () => {
        const nombre = form.nombre.trim();
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Ponle un nombre a la categoría' });
        setGuardando(true);
        try {
            const datos = { nombre, color: form.color, activa: form.activa, imagen: form.imagen.trim() };
            if (editId) await api.actualizarCategoria(editId, datos);
            else await api.crearCategoria(datos);
            setFormOpen(false);
            await cargar();
        } catch (e) {
            Swal.fire('No se pudo guardar', e.message || 'Intenta de nuevo', 'error');
        } finally {
            setGuardando(false);
        }
    };

    const alternarActiva = async (c) => {
        try {
            await api.actualizarCategoria(c.id, { activa: !(c.activa !== false) });
            await cargar();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo actualizar', 'error');
        }
    };

    const mover = async (idx, delta) => {
        const destinoIdx = idx + delta;
        if (destinoIdx < 0 || destinoIdx >= cats.length) return;
        const orden = [...cats];
        const [item] = orden.splice(idx, 1);
        orden.splice(destinoIdx, 0, item);
        setCats(orden); // respuesta inmediata; el servidor confirma después
        try {
            await api.reordenarCategorias(orden.map(c => c.id));
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo reordenar', 'error');
            cargar();
        }
    };

    const pedirBorrar = async (c) => {
        if (!c.productos) {
            const r = await Swal.fire({
                icon: 'warning',
                title: `¿Eliminar "${c.nombre}"?`,
                text: 'No tiene productos asociados.',
                showCancelButton: true,
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#e11d48',
            });
            if (!r.isConfirmed) return;
            try { await api.eliminarCategoria(c.id, ''); await cargar(); }
            catch (e) { Swal.fire('Error', e.message || 'No se pudo eliminar', 'error'); }
            return;
        }
        setDestino('');
        setBorrar(c);
    };

    const confirmarBorrar = async () => {
        if (!borrar) return;
        setGuardando(true);
        try {
            await api.eliminarCategoria(borrar.id, destino);
            setBorrar(null);
            await cargar();
        } catch (e) {
            Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="ms-categorias mx-auto max-w-5xl">
            <style>{`:where(.ms-categorias) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Menú</span>
                    <h1 className="m-0 mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Categorías</h1>
                    <p className="m-0 mt-1 text-[13px] text-slate-500 sm:text-sm">Los grupos con los que el mesero encuentra los productos al tomar un pedido</p>
                </div>
                <button className={btnPrimary} onClick={abrirNueva}><HiOutlinePlus className="h-4 w-4" /> Nueva categoría</button>
            </motion.div>

            {/* Métricas */}
            <motion.div variants={gridStagger} initial="hidden" animate="visible" className="mt-5 grid grid-cols-3 gap-2.5 sm:mt-6 sm:gap-4">
                <MetricCard icon={HiOutlineSquaresPlus} value={cats.length} label="Categorías" />
                <MetricCard icon={HiOutlineCube} value={cats.reduce((a, c) => a + Number(c.productos || 0), 0)} label="Productos clasificados" />
                <MetricCard icon={HiOutlineEyeSlash} value={cats.length - activas} label="Ocultas en el POS" />
            </motion.div>

            {/* Lista */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-4 sm:mt-5 ${cardBase}`}
            >
                <div className="flex items-center justify-between">
                    <h3 className="m-0 text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">Orden en el POS</h3>
                    <span className="text-[11px] text-slate-400 sm:text-xs">Con las flechas cambias el orden en que las ve el mesero</span>
                </div>

                {cargando ? (
                    <p className="mt-6 text-center text-sm text-slate-400">Cargando…</p>
                ) : cats.length === 0 ? (
                    <p className="mt-6 text-center text-sm text-slate-400">Todavía no hay categorías. Crea la primera.</p>
                ) : (
                    <ul className="m-0 mt-4 list-none space-y-2 p-0">
                        {cats.map((c, idx) => {
                            const ui = colorUI(c.color);
                            const oculta = c.activa === false;
                            return (
                                <li key={c.id} className={`flex list-none items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition-colors ${oculta ? 'bg-slate-50/70 ring-slate-100' : 'bg-white ring-slate-150 ring-slate-200'}`}>
                                    <div className="flex shrink-0 flex-col">
                                        <button onClick={() => mover(idx, -1)} disabled={idx === 0} aria-label="Subir" className="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition-colors hover:text-orange-500 disabled:opacity-30">
                                            <HiOutlineArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => mover(idx, 1)} disabled={idx === cats.length - 1} aria-label="Bajar" className="flex h-5 w-5 items-center justify-center rounded text-slate-300 transition-colors hover:text-orange-500 disabled:opacity-30">
                                            <HiOutlineArrowDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {c.imagen ? (
                                        <img src={imagenTransformada(c.imagen, { w: 120, h: 120, modo: 'fit', recortarBorde: true })} alt="" width="36" height="36" loading="lazy" decoding="async" style={{ backgroundColor: '#ffffff' }} className={`h-9 w-9 shrink-0 rounded-lg object-contain ring-1 ring-slate-200 ${oculta ? 'opacity-40' : ''}`} />
                                    ) : (
                                        <span style={{ backgroundColor: ui.hex }} className={`h-2.5 w-2.5 shrink-0 rounded-full ${oculta ? 'opacity-40' : ''}`} />
                                    )}

                                    <div className="min-w-0 flex-1">
                                        <p className={`m-0 truncate text-sm font-bold ${oculta ? 'text-slate-400' : 'text-slate-800'}`}>{c.nombre}</p>
                                        <p className="m-0 text-[11px] text-slate-400">{c.productos || 0} producto{c.productos === 1 ? '' : 's'}{oculta ? ' · oculta en el POS' : ''}</p>
                                    </div>

                                    <button onClick={() => alternarActiva(c)} className="hidden shrink-0 sm:block" title={oculta ? 'Mostrarla en el POS' : 'Ocultarla del POS'}>
                                        <span className={`block rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition-colors ${oculta ? 'bg-slate-100 text-slate-500 ring-slate-200' : ui.chip}`}>
                                            {oculta ? 'Oculta' : 'Visible'}
                                        </span>
                                    </button>
                                    <button onClick={() => abrirEditar(c)} aria-label="Editar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                                        <HiOutlinePencilSquare className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => pedirBorrar(c)} aria-label="Eliminar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
                                        <HiOutlineTrash className="h-4 w-4" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </motion.div>

            {/* Crear / editar */}
            {formOpen && (
                <Modal
                    title={editId ? 'Editar categoría' : 'Nueva categoría'}
                    onClose={() => setFormOpen(false)}
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => setFormOpen(false)}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
                        </>
                    }
                >
                    <div>
                        <label className={labelCls}>Nombre</label>
                        <input
                            autoFocus
                            className={inputCls}
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Ej: Comidas rápidas"
                            onKeyDown={e => { if (e.key === 'Enter') guardar(); }}
                        />
                        {editId && (
                            <p className="m-0 mt-1.5 text-[11px] text-slate-400">Si la renombras, sus productos se actualizan solos.</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label className={labelCls}>Color</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORES.map(c => (
                                <button
                                    key={c.key}
                                    onClick={() => setForm(f => ({ ...f, color: c.key }))}
                                    aria-label={c.key}
                                    aria-pressed={form.color === c.key}
                                    style={{ backgroundColor: c.hex }}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform ${form.color === c.key ? 'scale-110' : 'opacity-70 hover:scale-105 hover:opacity-100'}`}
                                >
                                    {form.color === c.key && <HiOutlineCheck className="h-4 w-4 text-white" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className={labelCls}>Imagen (opcional)</label>
                        <ImagenUploader
                            carpeta="categorias"
                            value={form.imagen}
                            onChange={url => setForm(f => ({ ...f, imagen: url }))}
                        />
                    </div>

                    <div className="mt-4">
                        <label className={labelCls}>Visible en el POS</label>
                        <Select className="w-full" value={form.activa ? '1' : '0'} onChange={e => setForm(f => ({ ...f, activa: e.target.value === '1' }))}>
                            <option value="1">Sí, el mesero la ve</option>
                            <option value="0">No, ocultarla</option>
                        </Select>
                    </div>
                </Modal>
            )}

            {/* Eliminar con productos dentro */}
            {borrar && (
                <Modal
                    title={`Eliminar "${borrar.nombre}"`}
                    onClose={() => setBorrar(null)}
                    footer={
                        <>
                            <button className={btnGhost} onClick={() => setBorrar(null)}>Cancelar</button>
                            <button
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/30 transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                                onClick={confirmarBorrar}
                                disabled={guardando}
                            >
                                {guardando ? 'Eliminando…' : 'Eliminar y mover'}
                            </button>
                        </>
                    }
                >
                    <p className="m-0 text-sm text-slate-600">
                        Esta categoría tiene <strong className="text-slate-900">{borrar.productos} producto(s)</strong>. Elige a dónde van antes de eliminarla; los productos no se borran.
                    </p>
                    <div className="mt-4">
                        <label className={labelCls}>Mover los productos a</label>
                        <Select className="w-full" value={destino} onChange={e => setDestino(e.target.value)}>
                            <option value="">Sin categoría</option>
                            {cats.filter(c => c.id !== borrar.id).map(c => (
                                <option key={c.id} value={c.nombre}>{c.nombre}</option>
                            ))}
                        </Select>
                    </div>
                </Modal>
            )}
        </div>
    );
}
