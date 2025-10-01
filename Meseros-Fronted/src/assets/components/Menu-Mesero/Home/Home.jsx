import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Meseros/Home/Home.css';
import { Link } from 'react-router-dom';
import { HiSquares2X2, HiCheckCircle, HiUsers, HiArrowRightCircle, HiBanknotes, HiCreditCard, HiCalculator, HiUser, HiEnvelope, HiPhone, HiIdentification } from 'react-icons/hi2';
import Swal from 'sweetalert2';

const getMesas = () => {
    try {
        const raw = localStorage.getItem('mesas');
        if (raw) return JSON.parse(raw);
    } catch {}
    return [];
};

const todayKey = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
};

const monthKey = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    return `${yyyy}-${mm}`;
};

const isToday = (ts) => {
    if (!ts) return false;
    const d = new Date(ts);
    return d.toISOString().slice(0,10) === todayKey();
};

const readArray = (key) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
    } catch { return []; }
};

const sumByDate = (arr, dateKey) => arr.reduce((acc, it) => acc + (it.fecha === dateKey ? Number(it.monto || it.amount || 0) : 0), 0);

const Home = () => {
    const mesas = useMemo(() => getMesas(), []);
    const [refreshKey, setRefreshKey] = useState(0);

    // Pedido modal state
    const [pedidoModal, setPedidoModal] = useState({ mesa: null, editable: false });
    const [pedidoItems, setPedidoItems] = useState([]);
    const [nuevoItem, setNuevoItem] = useState({ nombre: '', cantidad: 1, precio: 0 });

    // Usuario actual (si existe en localStorage)
    let nombre = 'Mesero';
    let apellido = '';
    let telefono = '';
    let correo = '';
    let documento = '';
    let usuario = '';
    let rol = '';
    let miId = 'mesero1';
    let sueldoBase = 0;
    try {
        const raw = localStorage.getItem('currentUser') || localStorage.getItem('auth:user');
        if (raw) {
            const u = JSON.parse(raw);
            nombre = u.nombre || u.name || u.fullName || u.username || nombre;
            apellido = u.apellido || u.apellidos || u.lastName || u.surname || '';
            telefono = u.telefono || u.phone || u.celular || u.mobile || u.whatsapp || '';
            correo = u.email || u.correo || u.mail || '';
            documento = u.documento || u.dni || u.cedula || u.idNumber || u.identificacion || '';
            usuario = u.usuario || u.username || '';
            rol = u.rol || u.role || '';
            miId = u.id || u.userId || u.uid || miId;
            sueldoBase = Number(u.sueldo || u.salario || u.salary || u.sueldoBase || 0) || 0;
        }
    } catch {}

    const iniciales = (nombre?.[0] || '').toUpperCase() + (apellido?.[0] || '').toUpperCase();

    const total = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const enLimpieza = mesas.filter(m => m.estado === 'limpieza').length;

    // Mesas atendidas hoy (aprox): mesas que cambiaron estado hoy y están/estuvieron asignadas a mi
    const mesasHoy = mesas.filter(m => m.meseroId === miId && isToday(m.updatedAt)).length;

    // Finanzas (según Admin): leer finanzas:ingresos y finanzas:egresos
    const [ingresosArr, setIngresosArr] = useState(() => readArray('finanzas:ingresos'));
    const [egresosArr, setEgresosArr] = useState(() => readArray('finanzas:egresos'));
    const today = todayKey();
    const ventasHoy = useMemo(() => ingresosArr.reduce((acc, it) => {
        const fechaOk = it && it.fecha === today;
        const tipo = it?.tipo || 'venta';
        return acc + (fechaOk && tipo === 'venta' ? Number(it.monto || it.amount || 0) : 0);
    }, 0), [ingresosArr]);
    const propinasHoy = useMemo(() => ingresosArr.reduce((acc, it) => {
        const fechaOk = it && it.fecha === today;
        return acc + (fechaOk && it?.tipo === 'propina' && it?.meseroId === miId ? Number(it.monto || it.amount || 0) : 0);
    }, 0), [ingresosArr, miId]);
    const egresosHoy = useMemo(() => sumByDate(egresosArr, today), [egresosArr]);
    const balanceHoy = ventasHoy - egresosHoy;

    // Nómina (mes actual)
    const mKey = monthKey();
    const matchesMonth = (fecha, m) => {
        if (!fecha) return false;
        try {
            if (typeof fecha === 'string') return fecha.startsWith(m);
            const d = new Date(fecha);
            if (isNaN(d.getTime())) return false;
            const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            return mk === m;
        } catch { return false; }
    };
    const sumNomina = (key) => {
        const arr = readArray(key);
        return arr.reduce((acc, it) => acc + ((it?.meseroId === miId && matchesMonth(it?.fecha, mKey)) ? Number(it.monto || it.amount || 0) : 0), 0);
    };
    const bonosMes = useMemo(() => sumNomina('nomina:bonos'), [refreshKey, miId]);
    const adelantosMes = useMemo(() => sumNomina('nomina:adelantos'), [refreshKey, miId]);
    const descuentosMes = useMemo(() => sumNomina('nomina:descuentos'), [refreshKey, miId]);
    const pagosNominaMes = useMemo(() => sumNomina('nomina:pagos'), [refreshKey, miId]);
    const propinasMes = useMemo(() => ingresosArr.reduce((acc, it) => acc + ((it?.meseroId === miId && it?.tipo === 'propina' && matchesMonth(it?.fecha, mKey)) ? Number(it.monto || it.amount || 0) : 0), 0), [ingresosArr, miId, refreshKey]);
    const sueldoNetoMes = sueldoBase + bonosMes - adelantosMes - descuentosMes;
    const saldoPorPagarMes = Math.max(0, sueldoNetoMes - pagosNominaMes);

    // Escuchar cambios de storage para actualizar ingresos/egresos y mesas/pedidos pagos
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'finanzas:ingresos') {
                setIngresosArr(() => readArray('finanzas:ingresos'));
            } else if (e.key === 'finanzas:egresos') {
                setEgresosArr(() => readArray('finanzas:egresos'));
            } else if (e.key && (e.key.startsWith('pedidos:mesa:') || e.key.startsWith('pagos:mesa:') || e.key === 'mesas')) {
                setRefreshKey(k => k + 1);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Mis mesas: mesas asignadas a mi, con total de pedido
    const misMesas = useMemo(() => {
        const list = mesas.filter(m => m.meseroId === miId);
        return list.map(m => {
            const key = `pedidos:mesa:${m.id}`;
            let items = [];
            try {
                const raw = localStorage.getItem(key);
                const data = raw ? JSON.parse(raw) : [];
                items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
            } catch {}
            const total = items.reduce((s, it) => s + (Number(it.cantidad||0) * Number(it.precio||0)), 0);
            // pagos abonados
            let pagos = [];
            try {
                const rawP = localStorage.getItem(`pagos:mesa:${m.id}`);
                const arr = rawP ? JSON.parse(rawP) : [];
                pagos = Array.isArray(arr) ? arr : [];
            } catch {}
            const abonado = pagos.reduce((s,p)=> s + Number(p.monto||0), 0);
            const pendiente = Math.max(0, total - abonado);
            return { ...m, totalPedido: total, abonado, pendiente };
        })
        .sort((a,b) => a.numero - b.numero);
    }, [mesas, miId, refreshKey]);

    // Pedido modal functions (mirroring Mesas)
    const abrirPedido = (mesa) => {
        if (!mesa) return;
        const keys = [
            `pedidos:mesa:${mesa.id}`,
            `pedidos:mesa:${mesa.numero}`,
            `mesa:${mesa.id}:pedidos`,
            `mesa:${mesa.numero}:pedidos`,
        ];
        let items = [];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k);
                if (!raw) continue;
                const data = JSON.parse(raw);
                if (Array.isArray(data)) { items = data; break; }
                if (Array.isArray(data?.items)) { items = data.items; break; }
                if (Array.isArray(data?.pedidos)) { items = data.pedidos; break; }
                if (Array.isArray(data?.ordenes)) { items = data.ordenes; break; }
            } catch {}
        }
        setPedidoItems(items.map(it => ({
            nombre: it.nombre || it.producto || it.name || 'Producto',
            cantidad: Number(it.cantidad ?? it.qty ?? it.quantity ?? 1) || 1,
            precio: Number(it.precio ?? it.price ?? it.unitPrice ?? 0) || 0,
        })));
        const editable = mesa.meseroId === miId && mesa.estado === 'ocupada';
        setPedidoModal({ mesa, editable });
    };
    const cerrarPedido = () => { setPedidoModal({ mesa: null, editable: false }); setNuevoItem({ nombre: '', cantidad: 1, precio: 0 }); };
    const agregarItem = () => {
        if (!pedidoModal.editable) return;
        const nombre = (nuevoItem.nombre || '').trim();
        const cantidad = Number(nuevoItem.cantidad || 1);
        const precio = Number(nuevoItem.precio || 0);
        if (!nombre) return Swal.fire({ icon: 'error', title: 'Ingresa el nombre del producto' });
        if (cantidad <= 0) return Swal.fire({ icon: 'error', title: 'Cantidad inválida' });
        if (precio < 0) return Swal.fire({ icon: 'error', title: 'Precio inválido' });
        setPedidoItems(prev => [...prev, { nombre, cantidad, precio }]);
        setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
    };
    const quitarItem = (idx) => { if (!pedidoModal.editable) return; setPedidoItems(prev => prev.filter((_, i) => i !== idx)); };
    const guardarPedido = () => {
        if (!pedidoModal.mesa) return;
        const key = `pedidos:mesa:${pedidoModal.mesa.id}`;
        localStorage.setItem(key, JSON.stringify(pedidoItems));
        Swal.fire({ icon: 'success', title: 'Pedido guardado', timer: 900, showConfirmButton: false });
        // refresh totals in Mis mesas
        setRefreshKey(k => k + 1);
    };

    return (
        <div className="home-page">
            <div className="home-header">
                <div>
                    <h1 className="home-title">Hola, {nombre}</h1>
                    <p className="home-sub">Gestiona tus mesas y pedidos rápidamente desde aquí.</p>
                </div>
                <div className="header-actions">
                    <Link className="btn primary" to="/mesero/mesas">
                        Ir a Mesas
                    </Link>
                </div>
            </div>

            <div className="home-metrics">
                <div className="metric-card">
                    <div className="metric-icon"><HiSquares2X2 /></div>
                    <div className="metric-info">
                        <div className="metric-value">{mesasHoy}</div>
                        <div className="metric-label">Mesas atendidas hoy</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiBanknotes /></div>
                    <div className="metric-info">
                        <div className="metric-value">${ventasHoy.toLocaleString('es-CO')}</div>
                        <div className="metric-label">Ventas de hoy</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiCreditCard /></div>
                    <div className="metric-info">
                        <div className="metric-value">${propinasHoy.toLocaleString('es-CO')}</div>
                        <div className="metric-label">Propinas de hoy</div>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon"><HiCalculator /></div>
                    <div className="metric-info">
                        <div className="metric-value">${balanceHoy.toLocaleString('es-CO')}</div>
                        <div className="metric-label">Balance de hoy</div>
                    </div>
                </div>
            </div>

            <div className="home-sections">
                <div className="panel">
                    <h3>Atajos rápidos</h3>
                    <div className="quick-links">
                        <Link to="/mesero/mesas" className="quick-link">
                            <span className="ico"><HiSquares2X2 /></span>
                            <span>Gestionar Mesas</span>
                        </Link>
                        <Link to="/mesero/meseros" className="quick-link">
                            <span className="ico"><HiUsers /></span>
                            <span>Compañeros</span>
                        </Link>
                    </div>
                </div>
                <div className="panel profile-card">
                    <h3>Mi perfil</h3>
                    <div className="profile-header">
                        <div className="avatar-lg" aria-hidden>
                            <span>{iniciales || (nombre?.[0] || 'M')}</span>
                        </div>
                        <div className="profile-main">
                            <div className="profile-name">{nombre} {apellido}</div>
                            <div className="profile-sub">{rol || 'Mesero'}{usuario ? ` · ${usuario}` : ''}</div>
                        </div>
                    </div>
                    <ul className="profile-list">
                        {telefono && (
                            <li className="profile-item"><HiPhone /><span>{telefono}</span></li>
                        )}
                        {correo && (
                            <li className="profile-item"><HiEnvelope /><span>{correo}</span></li>
                        )}
                        {documento && (
                            <li className="profile-item"><HiIdentification /><span>{documento}</span></li>
                        )}
                        <li className="profile-item"><HiUser /><span>ID interno: {miId}</span></li>
                    </ul>
                </div>
            </div>

            <div className="home-sections" style={{ marginTop: '1rem' }}>
                <div className="panel">
                    <h3>Mis mesas</h3>
                    {misMesas.length === 0 ? (
                        <div className="empty">Aún no tienes mesas asignadas. <Link to="/mesero/mesas">Ir a Mesas</Link></div>
                    ) : (
                        <ul className="mini-list">
                            {misMesas.map(m => (
                                <li key={m.id} className="mini-item" onClick={() => abrirPedido(m)} style={{cursor:'pointer'}}>
                                    <div className="mini-left">
                                        <span className={`status-dot ${m.estado}`}></span>
                                        <span className="mini-title">Mesa {m.numero}</span>
                                        <span className="mini-sub">{m.estado === 'ocupada' ? 'Ocupada' : m.estado === 'limpieza' ? 'En limpieza' : 'Libre'}</span>
                                        {m.totalPedido > 0 && (
                                            <span className={`mini-badge ${m.pendiente > 0 ? 'warn' : 'ok'}`}>{m.pendiente > 0 ? `Pendiente $${m.pendiente.toLocaleString('es-CO')}` : 'Saldado'}</span>
                                        )}
                                    </div>
                                    <div className="mini-right" onClick={(e)=>e.stopPropagation()}>
                                        <span className="mini-amount">${m.totalPedido.toLocaleString('es-CO')}</span>
                                        <button className="btn primary" style={{ padding: '.25rem .5rem' }} onClick={() => abrirPedido(m)}>Pedido</button>
                                        <Link className="btn" to="/mesero/mesas" style={{ padding: '.25rem .5rem' }}>Mesas</Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="panel">
                    <h3>Últimas novedades</h3>
                    <div className="empty">Sin novedades por ahora.</div>

                    <div className="home-sections" style={{ marginTop: '1rem' }}>
                        <div className="panel">
                            <h3>Nómina (mes actual)</h3>
                            <ul className="mini-list">
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Sueldo base</span></div>
                                    <div className="mini-right"><span className="mini-amount">${sueldoBase.toLocaleString('es-CO')}</span></div>
                                </li>
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Bonos del mes</span></div>
                                    <div className="mini-right"><span className="mini-amount">${bonosMes.toLocaleString('es-CO')}</span></div>
                                </li>
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Adelantos del mes</span></div>
                                    <div className="mini-right"><span className="mini-amount">-${adelantosMes.toLocaleString('es-CO')}</span></div>
                                </li>
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Descuentos del mes</span></div>
                                    <div className="mini-right"><span className="mini-amount">-${descuentosMes.toLocaleString('es-CO')}</span></div>
                                </li>
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Pagado este mes</span></div>
                                    <div className="mini-right"><span className="mini-amount">${pagosNominaMes.toLocaleString('es-CO')}</span></div>
                                </li>
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Saldo por pagar</span></div>
                                    <div className="mini-right"><span className="mini-amount">${saldoPorPagarMes.toLocaleString('es-CO')}</span></div>
                                </li>
                                <li className="mini-item">
                                    <div className="mini-left"><span className="mini-title">Propinas del mes</span><span className="mini-sub">(no incluidas en saldo)</span></div>
                                    <div className="mini-right"><span className="mini-amount">${propinasMes.toLocaleString('es-CO')}</span></div>
                                </li>
                            </ul>
                        </div>
                        <div className="panel">
                            <h3>Notas</h3>
                            <div className="empty">La nómina usa registros locales: nomina:bonos, nomina:adelantos, nomina:descuentos y nomina:pagos.</div>
                        </div>
                    </div>
                </div>
            </div>

            {pedidoModal.mesa && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card lg">
                        <div className="modal-header">
                            <h3>Pedido Mesa {pedidoModal.mesa.numero}</h3>
                            <button className="close-btn" onClick={cerrarPedido} aria-label="Cerrar">×</button>
                        </div>
                        <div className="modal-body">
                            {!pedidoModal.editable && (
                                <p className="muted" style={{marginTop:0}}>Solo lectura: esta mesa no está asignada a ti.</p>
                            )}
                            <div className="modal-grid">
                                <label>
                                    <span>Producto</span>
                                    <input value={nuevoItem.nombre} onChange={e=>setNuevoItem(prev=>({...prev, nombre: e.target.value}))} disabled={!pedidoModal.editable} />
                                </label>
                                <label>
                                    <span>Cantidad</span>
                                    <input type="number" min="1" value={nuevoItem.cantidad} onChange={e=>setNuevoItem(prev=>({...prev, cantidad: Number(e.target.value||1)}))} disabled={!pedidoModal.editable} />
                                </label>
                                <label>
                                    <span>Precio</span>
                                    <input type="number" min="0" value={nuevoItem.precio} onChange={e=>setNuevoItem(prev=>({...prev, precio: Number(e.target.value||0)}))} disabled={!pedidoModal.editable} />
                                </label>
                                <div style={{alignSelf:'end'}}>
                                    <button className="btn" onClick={agregarItem} disabled={!pedidoModal.editable}>Agregar</button>
                                </div>
                            </div>
                            <div className="consumos-wrap" style={{marginTop:'1rem'}}>
                                <table className="table-consumos">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>Precio</th>
                                            <th>Subtotal</th>
                                            {pedidoModal.editable && <th></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidoItems.map((it, idx) => (
                                            <tr key={idx}>
                                                <td>{it.nombre}</td>
                                                <td className="td-right">{it.cantidad}</td>
                                                <td className="td-right">${it.precio.toLocaleString('es-CO')}</td>
                                                <td className="td-right">${(it.cantidad*it.precio).toLocaleString('es-CO')}</td>
                                                {pedidoModal.editable && (
                                                    <td className="td-right"><button className="btn ghost" onClick={() => quitarItem(idx)}>Quitar</button></td>
                                                )}
                                            </tr>
                                        ))}
                                        {pedidoItems.length === 0 && (
                                            <tr>
                                                <td colSpan={pedidoModal.editable ? 5 : 4}><div className="empty" style={{margin:0}}>Sin productos.</div></td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="td-right"><strong>Total</strong></td>
                                            <td className="td-right" colSpan={pedidoModal.editable ? 2 : 1}><strong>${pedidoItems.reduce((s,it)=>s+it.cantidad*it.precio,0).toLocaleString('es-CO')}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarPedido}>Cerrar</button>
                            {pedidoModal.editable && <button className="btn primary" onClick={guardarPedido}>Guardar</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
