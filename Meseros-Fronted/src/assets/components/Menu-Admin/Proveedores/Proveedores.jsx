import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineTruck,
    HiOutlineCube,
    HiOutlineLink,
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineCheck,
    HiXMark,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';

const emptyForm = () => ({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    productos_ids: [],
});

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

function Modal({ title, onClose, children, footer, maxW = 'max-w-2xl' }) {
    return (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`ms-prov flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100`}
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

const Th = ({ children, center }) => (
    <th className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 ${center ? 'text-center' : 'text-left'}`}>{children}</th>
);

const Proveedores = () => {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [prodSearch, setProdSearch] = useState('');

    const cargar = async () => {
        setLoading(true);
        try {
            const [provRes, prodRes] = await Promise.allSettled([
                api.getProveedores(),
                api.getProductos(),
            ]);
            if (provRes.status === 'fulfilled') setProveedores(Array.isArray(provRes.value) ? provRes.value : []);
            if (prodRes.status === 'fulfilled') {
                const items = Array.isArray(prodRes.value?.items) ? prodRes.value.items : Array.isArray(prodRes.value) ? prodRes.value : [];
                setProductos(items);
            }
        } catch {}
        setLoading(false);
    };

    useEffect(() => { cargar(); }, []);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return proveedores;
        return proveedores.filter(p =>
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.contacto || '').toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q)
        );
    }, [proveedores, busqueda]);

    const abrirNuevo = () => {
        setEditId(null);
        setForm(emptyForm());
        setProdSearch('');
        setShowModal(true);
    };

    const abrirEditar = (prov) => {
        setEditId(prov.id);
        setForm({
            nombre: prov.nombre || '',
            contacto: prov.contacto || '',
            telefono: prov.telefono || '',
            email: prov.email || '',
            direccion: prov.direccion || '',
            productos_ids: Array.isArray(prov.productos_ids) ? prov.productos_ids : [],
        });
        setProdSearch('');
        setShowModal(true);
    };

    const cerrarModal = () => setShowModal(false);

    const guardar = async () => {
        if (!form.nombre.trim()) return Swal.fire({ icon: 'warning', title: 'Nombre requerido' });
        try {
            if (editId) {
                await api.actualizarProveedor(editId, form);
                setProveedores(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p));
                Swal.fire({ icon: 'success', title: 'Proveedor actualizado', timer: 900, showConfirmButton: false });
            } else {
                const res = await api.crearProveedor(form);
                setProveedores(prev => [{ ...form, id: res?.id || Date.now() }, ...prev]);
                Swal.fire({ icon: 'success', title: 'Proveedor creado', timer: 900, showConfirmButton: false });
            }
            setShowModal(false);
        } catch (e) {
            Swal.fire('Error', e?.message || 'No se pudo guardar', 'error');
        }
    };

    const eliminar = async (prov) => {
        const res = await Swal.fire({
            title: `Eliminar ${prov.nombre}`,
            text: '¿Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
        });
        if (!res.isConfirmed) return;
        try {
            await api.eliminarProveedor(prov.id);
            setProveedores(prev => prev.filter(p => p.id !== prov.id));
            Swal.fire({ icon: 'success', title: 'Eliminado', timer: 800, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e?.message || 'No se pudo eliminar', 'error');
        }
    };

    const toggleProducto = (pid) => {
        setForm(prev => {
            const ids = prev.productos_ids || [];
            const exists = ids.includes(pid);
            return { ...prev, productos_ids: exists ? ids.filter(x => x !== pid) : [...ids, pid] };
        });
    };

    const productosFiltrados = useMemo(() => {
        const q = prodSearch.trim().toLowerCase();
        if (!q) return productos;
        return productos.filter(p => `${p.nombre || ''}`.toLowerCase().includes(q));
    }, [productos, prodSearch]);

    const avatarOf = (p) => String(`${p.nombre || ''}`.trim().charAt(0) || '?').toUpperCase();

    // Métricas
    const productosAsociados = proveedores.reduce((s, p) => s + (Array.isArray(p.productos_ids) ? p.productos_ids.length : 0), 0);

    const CAMPOS = [
        { label: 'Nombre *', key: 'nombre', placeholder: 'Ej. Distribuidora Norte', full: false },
        { label: 'Persona de contacto', key: 'contacto', placeholder: 'Juan Pérez', full: false },
        { label: 'Teléfono', key: 'telefono', placeholder: '+57 300 000 0000', full: false },
        { label: 'Email', key: 'email', placeholder: 'proveedor@empresa.com', type: 'email', full: false },
        { label: 'Dirección', key: 'direccion', placeholder: 'Calle 1 # 2-3, Ciudad', full: true },
    ];

    return (
        <div className="ms-prov mx-auto max-w-7xl">
            <style>{`:where(.ms-prov) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Cadena de suministro</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Proveedores</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Gestiona tus proveedores y sus productos asociados</p>
                </div>
                <button className={btnPrimary} onClick={abrirNuevo}>
                    <HiOutlinePlus className="h-4 w-4" /> Nuevo proveedor
                </button>
            </motion.div>

            {/* Métricas */}
            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
                <MetricCard icon={HiOutlineTruck} value={proveedores.length} label="Proveedores" chip={<Chip tone="orange">Activos</Chip>} />
                <MetricCard icon={HiOutlineCube} value={productos.length} label="Productos en catálogo" />
                <MetricCard icon={HiOutlineLink} value={productosAsociados} label="Productos asociados" chip={<Chip tone="emerald">Vínculos</Chip>} />
            </motion.div>

            {/* Toolbar: búsqueda */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                className={`mt-5 ${cardBase}`}
            >
                <div className="relative sm:max-w-md">
                    <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar proveedor…"
                        className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                    />
                </div>
            </motion.div>

            {/* Tabla de proveedores */}
            {loading ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex animate-pulse items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-200" />
                                <div className="h-4 flex-1 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : filtrados.length === 0 ? (
                <div className={`mt-5 ${cardBase}`}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><HiOutlineTruck className="h-6 w-6" /></span>
                        <p className="m-0 text-sm text-slate-400">{busqueda ? 'Sin resultados para la búsqueda.' : 'No hay proveedores aún. Crea el primero.'}</p>
                        {!busqueda && <button className={`${btnPrimary} mt-2`} onClick={abrirNuevo}><HiOutlinePlus className="h-4 w-4" /> Nuevo proveedor</button>}
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
                    className={`mt-5 ${cardBase} overflow-hidden p-0`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-100">
                                    <Th>Proveedor</Th>
                                    <Th>Contacto</Th>
                                    <Th>Teléfono</Th>
                                    <Th>Email</Th>
                                    <Th>Dirección</Th>
                                    <Th center>Productos</Th>
                                    <Th center>Acciones</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map(prov => (
                                    <tr key={prov.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-extrabold text-orange-600 ring-2 ring-orange-100">{avatarOf(prov)}</span>
                                                <span className="text-sm font-bold text-slate-900">{prov.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{prov.contacto || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{prov.telefono || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{prov.email || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-400">{prov.direccion || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                                {(prov.productos_ids || []).length}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button onClick={() => abrirEditar(prov)} title="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900">
                                                    <HiOutlinePencilSquare className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => eliminar(prov)} title="Eliminar" className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 ring-1 ring-red-100 transition-colors hover:bg-red-50">
                                                    <HiOutlineTrash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Modal crear/editar */}
            {showModal && (
                <Modal
                    title={editId ? 'Editar proveedor' : 'Nuevo proveedor'}
                    onClose={cerrarModal}
                    footer={
                        <>
                            <button className={btnGhost} onClick={cerrarModal}>Cancelar</button>
                            <button className={btnPrimary} onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear proveedor'}</button>
                        </>
                    }
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {CAMPOS.map(({ label, key, placeholder, type, full }) => (
                            <div key={key} className={full ? 'sm:col-span-2' : ''}>
                                <label className={labelCls}>{label}</label>
                                <input
                                    type={type || 'text'}
                                    className={inputCls}
                                    value={form[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}
                        <div className="sm:col-span-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <label className={`${labelCls} mb-0`}>Productos asociados</label>
                                {(form.productos_ids || []).length > 0 && <Chip tone="orange">{form.productos_ids.length} sel.</Chip>}
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
                                            const sel = (form.productos_ids || []).includes(p.id);
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => toggleProducto(p.id)}
                                                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold ring-1 transition-colors ${sel ? 'bg-orange-50 text-orange-700 ring-orange-200' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    <span className="truncate">{p.nombre}</span>
                                                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md ${sel ? 'bg-orange-500 text-white' : 'ring-1 ring-slate-300'}`}>
                                                        {sel && <HiOutlineCheck className="h-3 w-3" />}
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
};

export default Proveedores;
