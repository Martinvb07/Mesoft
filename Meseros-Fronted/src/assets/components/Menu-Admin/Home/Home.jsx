
import React, { useEffect, useState, useMemo } from "react";
import '../../../css/Navbar/Menu-Admin/Home/Home.css';
import logo from '../../../image/Logo.png';
import { HiSquares2X2, HiUsers, HiClipboardDocumentList, HiBanknotes, HiArrowTrendingUp, HiArrowTrendingDown } from 'react-icons/hi2';
import { api } from '../../../../api/client';

function Home() {
    const [meserosLista, setMeserosLista] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [ventasHoy, setVentasHoy] = useState(0);
    const [balanceHoy, setBalanceHoy] = useState({ balance: 0, ingresos: 0, egresos: 0 });
    const [ticketPromedio, setTicketPromedio] = useState(0);
    const [variacionPct, setVariacionPct] = useState(0);
    const [metaHoy, setMetaHoy] = useState({ meta: 0, ventas: 0, progresoPct: 0 });
    const [egresosHoyCategorias, setEgresosHoyCategorias] = useState([]);
    const [topProductos, setTopProductos] = useState([]);
    const [mesas, setMesas] = useState([]);
    const [pedidosEnCurso, setPedidosEnCurso] = useState(0);
    const [meserosActivosCount, setMeserosActivosCount] = useState(0);

    useEffect(() => {
        let cancel = false;
        async function load() {
            try {
                setCargando(true);
                // Meseros activos (lista y conteo)
                try {
                    const lista = await api.getMeseros();
                    const activos = (Array.isArray(lista) ? lista : []).filter(u => (u.activo === 1 || u.activo === true || `${u.estado || ''}`.toLowerCase() === 'activo'));
                    if (!cancel) {
                        setMeserosLista(activos);
                        setMeserosActivosCount(activos.length);
                    }
                } catch (e) {
                    if (!cancel) setError('No se pudieron cargar los meseros.');
                }
                // Finanzas: ventas hoy y balance hoy
                try {
                    const v = await api.ventasHoy();
                    if (!cancel) setVentasHoy(Number(v?.ventas || 0));
                } catch {}
                try {
                    const b = await api.balanceHoy();
                    if (!cancel) setBalanceHoy({
                        balance: Number(b?.balance || 0),
                        ingresos: Number(b?.ingresos || 0),
                        egresos: Number(b?.egresos || 0),
                    });
                } catch {}
                // Ticket promedio y variación
                try {
                    const t = await api.ticketPromedioHoy();
                    if (!cancel) setTicketPromedio(Number(t?.ticket_promedio || 0));
                } catch {}
                try {
                    const vv = await api.variacionVentasDia();
                    if (!cancel) setVariacionPct(Number(vv?.variacionPct || 0));
                } catch {}
                // Meta diaria progreso
                try {
                    const mh = await api.metaHoy();
                    if (!cancel) setMetaHoy({
                        meta: Number(mh?.meta || 0),
                        ventas: Number(mh?.ventas || 0),
                        progresoPct: Number(mh?.progresoPct || 0)
                    });
                } catch {}
                // Mesas para métricas de ocupación
                try {
                    const ms = await api.getMesas();
                    if (!cancel) setMesas(Array.isArray(ms) ? ms : []);
                } catch {}
                // Pedidos en curso
                try {
                    const pk = await api.pedidosEnCurso();
                    if (!cancel) setPedidosEnCurso(Number(pk?.count || 0));
                } catch {}
                // (Ya cargados arriba)
                // Costos e Insumos (egresos por categoría hoy)
                try {
                    const eg = await api.egresosCategoriasHoy();
                    if (!cancel) setEgresosHoyCategorias(Array.isArray(eg) ? eg : []);
                } catch {}
                // Top productos últimos 7 días
                try {
                    const tp = await api.topProductos({ limit: 4 });
                    if (!cancel) setTopProductos(Array.isArray(tp) ? tp : []);
                } catch {}
            } finally {
                if (!cancel) setCargando(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, []);

    const meserosActivos = useMemo(() => {
        const fullName = (u = {}) => {
            const n = `${u.nombre || u.name || ''}`.trim();
            return n || u.usuario || u.username || u.correo || `Mesero #${u.id || ''}`;
        };
        const lista = (meserosLista || []).map(u => ({ id: u.id, nombre: fullName(u) }));
        return { total: lista.length, lista: lista.slice(0, 8) };
    }, [meserosLista]);

    // Métricas calculadas desde API (con fallback si no hay datos)
    const mesasTotales = mesas.length;
    const libres = mesas.filter(m => m.estado === 'libre').length;
    const reservadas = mesas.filter(m => m.estado === 'reservada').length;
    const ocupadas = mesas.filter(m => m.estado === 'ocupada').length;
    const occPct = mesasTotales > 0 ? Math.round((ocupadas / mesasTotales) * 100) : 0;

    // Nombre del restaurante desde storage (flexible con varios posibles campos)
    const restaurantName = useMemo(() => {
        const pickName = (u) => {
            if (!u || typeof u !== 'object') return '';
            return (
                u.restaurante || u.nombreRestaurante || u.nombre_restaurante ||
                u.empresa || u.company || u.organization || u.organizacion || ''
            );
        };
        const keys = ['usuario', 'user', 'auth_user', 'currentUser'];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
                if (!raw) continue;
                const obj = JSON.parse(raw);
                const name = pickName(obj.usuario || obj.user || obj) || '';
                if (name) return String(name);
            } catch {}
        }
        return 'Mi Restaurante';
    }, []);

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>{restaurantName}</h1>
            </div>
            <div className="metrics-wrap">
                <div className="metrics-grid">
                    <div className="metric-card">
                        <div className="metric-icon">
                            <HiSquares2X2 size={28} style={{ color: 'var(--brand)' }} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-duo">
                                <span className="big">{libres}</span>
                                <span className="den">/ {mesasTotales}</span>
                            </div>
                            <div className="metric-label">Mesas disponibles</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">
                            <HiUsers size={28} style={{ color: 'var(--brand)' }} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">{meserosActivosCount || meserosActivos.total}</div>
                            <div className="metric-label">Meseros Activos</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">
                            <HiClipboardDocumentList size={28} style={{ color: 'var(--brand)' }} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">{pedidosEnCurso}</div>
                            <div className="metric-label">Pedidos en curso</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-icon">
                            <HiBanknotes size={28} style={{ color: 'var(--brand)' }} />
                        </div>
                        <div className="metric-info">
                            <div className="metric-value">${ventasHoy.toLocaleString('es-CO')}</div>
                            <div className="metric-label">Ventas de hoy</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-grid">

                {/* Producción y Ventas */}
                <div className="card sales">
                    <h3>Producción y Ventas</h3>
                    <div className="kpi-grid">
                        <div className="kpi">
                            <span className="kpi-label">Ventas hoy</span>
                            <span className="kpi-value">${ventasHoy.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="kpi">
                            <span className="kpi-label">Ingresos hoy</span>
                            <span className="kpi-value">${balanceHoy.ingresos.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="kpi">
                            <span className="kpi-label">Egresos hoy</span>
                            <span className="kpi-value">${balanceHoy.egresos.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="kpi">
                            <span className="kpi-label">Ticket promedio</span>
                            <span className="kpi-value">${ticketPromedio.toLocaleString('es-CO')}</span>
                        </div>
                        <div className="kpi">
                            <span className="kpi-label">Variación</span>
                            <span className="kpi-value"><span className="pill">{variacionPct >= 0 ? '+' : ''}{variacionPct.toFixed(1)}%</span></span>
                        </div>
                    </div>
                    <div className="goal">
                        <div className="muted" style={{ marginBottom: '.25rem' }}>Meta diaria: ${metaHoy.meta.toLocaleString('es-CO')} — Ventas: ${metaHoy.ventas.toLocaleString('es-CO')} ({metaHoy.progresoPct.toFixed(0)}%)</div>
                        <div className="goal-bar"><span style={{ width: `${Math.min(100, metaHoy.progresoPct)}%` }} /></div>
                    </div>
                </div>

                {/* Meseros activos  */}
                <div className="card">
                    <h3>Meseros activos {cargando ? '(cargando...)' : `(${meserosActivos.total})`}</h3>
                    {error && <p className="muted" style={{ marginTop: '.25rem' }}>{error}</p>}
                    <div className="staff-list">
                        {meserosActivos.lista.map(m => (
                            <div key={m.id} className="staff-item">
                                <div className="avatar">{(m.nombre || '?').charAt(0)}</div>
                                <span>{m.nombre}</span>
                                <span className="status-dot" />
                            </div>
                        ))}
                        {!cargando && meserosActivos.lista.length === 0 && (
                            <div className="staff-item muted">No hay meseros activos.</div>
                        )}
                    </div>
                </div>

                {/* Resumen de Ocupación */}
                <div className="card">
                    <div className="occ-header">
                        <h3>Resumen de Ocupación</h3>
                        <span className="pill occ-rate">{occPct}%</span>
                    </div>
                    <div className="segmented-bar" aria-label="Ocupación">
                        <span className="seg occ" style={{ width: `${mesasTotales>0 ? (ocupadas/mesasTotales)*100 : 0}%` }} />
                        <span className="seg res" style={{ width: `${mesasTotales>0 ? (reservadas/mesasTotales)*100 : 0}%` }} />
                        <span className="seg free" style={{ width: `${mesasTotales>0 ? (libres/mesasTotales)*100 : 0}%` }} />
                    </div>
                    <div className="occ-kpis">
                        <div className="kpi"><span className="dot-sq occ" /><span>Ocupadas</span><strong>{ocupadas}</strong></div>
                        <div className="kpi"><span className="dot-sq res" /><span>Reservadas</span><strong>{reservadas}</strong></div>
                        <div className="kpi"><span className="dot-sq free" /><span>Libres</span><strong>{libres}</strong></div>
                    </div>
                </div>

                {/* Fila centrada con 2 columnas iguales para Costos e Insumos y Top Productos */}
                <div className="grid-row-2col">
                    <div className="two-col-cards">
                        {/* Costos e Insumos (tabla profesional) */}
                        <div className="card">
                            <h3>Costos e Insumos (hoy)</h3>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Categoría</th>
                                        <th className="td-right">Movimientos</th>
                                        <th className="td-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {egresosHoyCategorias.map((r, idx) => (
                                        <tr key={idx}>
                                            <td>{r.categoria}</td>
                                            <td className="td-right">{r.movimientos}</td>
                                            <td className="td-right">${Number(r.total||0).toLocaleString('es-CO')}</td>
                                        </tr>
                                    ))}
                                    {!egresosHoyCategorias.length && (
                                        <tr><td colSpan={3} className="muted">Sin egresos registrados hoy.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="mini-progress">
                                <div className="mini-progress-bar"><span style={{ width: `${Math.min(100, (balanceHoy.egresos>0? Math.min(balanceHoy.egresos, balanceHoy.ingresos)/Math.max(1,balanceHoy.ingresos) : 0)*100)}%` }} /></div>
                                <div className="mini-progress-legend"><span>Egresos/Ingresos hoy</span><span>{balanceHoy.ingresos>0 ? ((balanceHoy.egresos/Math.max(1,balanceHoy.ingresos))*100).toFixed(0) : 0}%</span></div>
                            </div>
                        </div>

                        {/* Top Productos (tabla profesional) */}
                        <div className="card">
                            <h3>Top Productos (últimos 7 días)</h3>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th className="td-right">Unidades</th>
                                        <th className="td-right">Ingresos</th>
                                        <th className="td-right">Tendencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProductos.map((p) => (
                                        <tr key={p.producto_id}>
                                            <td>{p.nombre}</td>
                                            <td className="td-right">{Number(p.unidades||0)}</td>
                                            <td className="td-right">${Number(p.ingresos||0).toLocaleString('es-CO')}</td>
                                            <td className="td-right">
                                                {Number(p.tendenciaPct||0) >= 0 ? (
                                                    <span className="trend-pill up"><HiArrowTrendingUp /> {`+${Number(p.tendenciaPct).toFixed(1)}%`}</span>
                                                ) : (
                                                    <span className="trend-pill down"><HiArrowTrendingDown /> {`${Number(p.tendenciaPct).toFixed(1)}%`}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!topProductos.length && (
                                        <tr><td colSpan={4} className="muted">No hay datos de productos aún.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
