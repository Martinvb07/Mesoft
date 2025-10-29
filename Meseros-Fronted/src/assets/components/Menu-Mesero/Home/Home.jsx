import React, { useEffect, useMemo, useState } from 'react';
import '../../../css/Navbar/Menu-Meseros/Home/Home.css';
import { Link } from 'react-router-dom';
import { HiSquares2X2, HiUsers, HiBanknotes, HiCreditCard, HiCalculator, HiUser, HiEnvelope, HiPhone, HiIdentification } from 'react-icons/hi2';
import { api } from '../../../../api/client';

// Helpers de fecha
const fmtDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};
const todayKey = () => fmtDate(new Date());
const monthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { desde: fmtDate(start), hasta: fmtDate(end) };
};

const Home = () => {
    // Perfil: NO usamos localStorage; se obtiene desde backend (mesero actual)
    const [perfil, setPerfil] = useState({ nombre: 'Mesero', apellido: '', telefono: '', correo: '', documento: '', usuario: '', rol: 'mesero', userId: null });
    const nombre = perfil.nombre; const apellido = perfil.apellido; const telefono = perfil.telefono; const correo = perfil.correo; const documento = perfil.documento; const usuario = perfil.usuario; const rol = perfil.rol; const userId = perfil.userId;
    const iniciales = ((nombre?.[0] || '') + (apellido?.[0] || '')).toUpperCase();

    // Estado principal
    const [mesas, setMesas] = useState([]);
    const [meseroInfo, setMeseroInfo] = useState(null); // { id, nombre, sueldo_base }
    const [ventasHoy, setVentasHoy] = useState(0);
    const [propinasHoy, setPropinasHoy] = useState(0);
    const [balanceHoy, setBalanceHoy] = useState(0);
    const [mesasHoy, setMesasHoy] = useState(0);

    // Nómina
    const [bonosMes, setBonosMes] = useState(0);
    const [adelantosMes, setAdelantosMes] = useState(0);
    const [descuentosMes, setDescuentosMes] = useState(0);
    const [pagosNominaMes, setPagosNominaMes] = useState(0);
    const [sueldoBase, setSueldoBase] = useState(0);
    const [propinasMes, setPropinasMes] = useState(0);

    // Totales por mesa (pedido abierto)
    const [pedidoPorMesa, setPedidoPorMesa] = useState({}); // mesaId -> { total, items }
    const [pedidoModal, setPedidoModal] = useState({ mesa: null });

    // Cargar mesas
    useEffect(() => {
        const loadMesas = async () => {
            try {
                const data = await api.getMesas();
                setMesas(Array.isArray(data) ? data : []);
            } catch (e) {
                setMesas([]);
            }
        };
        loadMesas();
    }, []);

    // Cargar perfil (mesero actual) desde backend
    useEffect(() => {
        const loadPerfil = async () => {
            try {
                const me = await api.getMiMesero();
                setPerfil(prev => ({
                    ...prev,
                    nombre: me?.nombre || 'Mesero',
                    correo: me?.correo || '',
                    rol: 'mesero',
                    userId: me?.usuario_id ?? null,
                }));
                setMeseroInfo({ id: me?.id, nombre: me?.nombre, sueldo_base: Number(me?.sueldo_base || 0) });
                setSueldoBase(Number(me?.sueldo_base || 0));
            } catch {
                setPerfil(prev => ({ ...prev, userId: null }));
                setMeseroInfo(null);
            }
        };
        loadPerfil();
    }, []);

    // Resolver mesero actual por usuario_id
    useEffect(() => {
        if (!userId) return;
        const loadMesero = async () => {
            try {
                const list = await api.getMeseros();
                const me = (Array.isArray(list) ? list : []).find(m => Number(m.usuario_id) === Number(userId));
                if (me) {
                    setMeseroInfo({ id: me.id, nombre: me.nombre, sueldo_base: Number(me.sueldo_base || 0) });
                    setSueldoBase(Number(me.sueldo_base || 0));
                } else {
                    setMeseroInfo(null);
                }
            } catch {
                setMeseroInfo(null);
            }
        };
        loadMesero();
    }, [userId]);

    // KPIs del día (ventas, propinas, balance, mesas atendidas)
    useEffect(() => {
        const loadKpis = async () => {
            try {
                const [v, b] = await Promise.all([
                    api.ventasHoy().catch(() => ({ ventas: 0 })),
                    api.balanceHoy().catch(() => ({ balance: 0 })),
                ]);
                setVentasHoy(Number(v?.ventas || 0));
                setBalanceHoy(Number(b?.balance || 0));
            } catch {}
        };
        loadKpis();
    }, []);

    useEffect(() => {
        const loadPropinasYMesasHoy = async () => {
            if (!meseroInfo?.id) return;
            const hoy = todayKey();
            try {
                // Propinas de hoy por mesero
                const p = await api.propinas(meseroInfo.id, hoy, hoy).catch(() => ({ propinas: 0 }));
                setPropinasHoy(Number(p?.propinas || 0));

                // Mesas atendidas hoy (aprox): pedidos en curso hoy de este mesero
                const enCurso = await api.pedidosEnCurso().catch(() => ({ pedidos: [] }));
                const count = (enCurso?.pedidos || []).filter(pe => {
                    const fh = pe?.fecha_hora ? new Date(pe.fecha_hora) : null;
                    const sameDay = fh ? fmtDate(fh) === hoy : false;
                    return sameDay && Number(pe.mesero_id || 0) === Number(meseroInfo.id);
                }).length;
                setMesasHoy(count);
            } catch {
                setPropinasHoy(0);
                setMesasHoy(0);
            }
        };
        loadPropinasYMesasHoy();
    }, [meseroInfo?.id]);

    // Nómina (mes actual) desde API
    useEffect(() => {
        const loadNomina = async () => {
            if (!meseroInfo?.id) return;
            const { desde, hasta } = monthRange();
            try {
                const movs = await api.obtenerNomina(meseroInfo.id, desde, hasta).catch(() => []);
                const sum = (tipo) => movs.filter(m => String(m.tipo || '').toLowerCase() === tipo).reduce((s, m) => s + Number(m.monto || 0), 0);
                setBonosMes(sum('bono'));
                setAdelantosMes(sum('adelanto'));
                setDescuentosMes(sum('descuento'));
                setPagosNominaMes(sum('pago'));
                // Propinas del mes
                const pr = await api.propinas(meseroInfo.id, desde, hasta).catch(() => ({ propinas: 0 }));
                setPropinasMes(Number(pr?.propinas || 0));
            } catch {
                setBonosMes(0); setAdelantosMes(0); setDescuentosMes(0); setPagosNominaMes(0); setPropinasMes(0);
            }
        };
        loadNomina();
    }, [meseroInfo?.id]);

    // Mis mesas (asignadas a mi) obtenido directo del backend
    const [misMesasBase, setMisMesasBase] = useState([]);
    useEffect(() => {
        const loadMis = async () => {
            try {
                const mm = await api.getMisMesas();
                setMisMesasBase(Array.isArray(mm) ? mm.sort((a,b)=>a.numero-b.numero) : []);
            } catch {
                setMisMesasBase([]);
            }
        };
        loadMis();
    }, [meseroInfo?.id]);

    useEffect(() => {
        const loadTotales = async () => {
            if (!misMesasBase.length) { setPedidoPorMesa({}); return; }
            const acc = {};
            for (const m of misMesasBase) {
                try {
                    const ped = await api.getPedidoAbiertoDeMesa(m.id);
                    if (!ped || !ped.id) { acc[m.id] = { total: 0, items: [] }; continue; }
                    const items = await api.getPedidoItems(ped.id).catch(() => []);
                    const total = (Array.isArray(items) ? items : []).reduce((s, it) => s + Number(it.subtotal || (it.cantidad || 0) * (it.precio || 0)), 0);
                    acc[m.id] = { total, items };
                } catch {
                    acc[m.id] = { total: 0, items: [] };
                }
            }
            setPedidoPorMesa(acc);
        };
        loadTotales();
    }, [misMesasBase.length]);

    const abrirPedido = (mesa) => {
        if (!mesa) return;
        setPedidoModal({ mesa });
    };
    const cerrarPedido = () => setPedidoModal({ mesa: null });

    const total = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const enLimpieza = mesas.filter(m => m.estado === 'limpieza').length;
    const sueldoNetoMes = sueldoBase + bonosMes - adelantosMes - descuentosMes;
    const saldoPorPagarMes = Math.max(0, sueldoNetoMes - pagosNominaMes);

    const misMesas = misMesasBase.map(m => {
        const info = pedidoPorMesa[m.id] || { total: 0 };
        const pendiente = info.total; // no manejamos pagos parciales por ahora
        return { ...m, totalPedido: info.total, pendiente };
    });

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
                            <div className="empty">La nómina se calcula desde los movimientos registrados en el backend.</div>
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
                            <p className="muted" style={{marginTop:0}}>Vista de solo lectura. Para gestionar pedidos, ve a la pantalla de Mesas.</p>
                            <div className="consumos-wrap" style={{marginTop:'1rem'}}>
                                <table className="table-consumos">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cant.</th>
                                            <th>Precio</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(pedidoPorMesa[pedidoModal.mesa.id]?.items || []).map((it, idx) => (
                                            <tr key={idx}>
                                                <td>{it.nombre || it.producto_nombre || '-'}</td>
                                                <td className="td-right">{it.cantidad}</td>
                                                <td className="td-right">${Number(it.precio || 0).toLocaleString('es-CO')}</td>
                                                <td className="td-right">${Number(it.subtotal || ((it.cantidad||0)*(it.precio||0))).toLocaleString('es-CO')}</td>
                                            </tr>
                                        ))}
                                        {(pedidoPorMesa[pedidoModal.mesa.id]?.items || []).length === 0 && (
                                            <tr>
                                                <td colSpan={4}><div className="empty" style={{margin:0}}>Sin productos.</div></td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="td-right"><strong>Total</strong></td>
                                            <td className="td-right"><strong>${Number(pedidoPorMesa[pedidoModal.mesa.id]?.total || 0).toLocaleString('es-CO')}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn" onClick={cerrarPedido}>Cerrar</button>
                            <Link className="btn primary" to="/mesero/mesas">Gestionar en Mesas</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
