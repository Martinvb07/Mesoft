import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { HiReceiptPercent, HiClock, HiCheckCircle, HiBanknotes, HiCurrencyDollar, HiXMark } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Finanzas/Nominas.css';
import { api } from '../../../../api/client';

const nowIso = () => new Date().toISOString();
const toCurrency = (n) => (isNaN(n) ? '$0' : n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }));
const parseNum = (v) => { if (typeof v === 'number') return v; const n = Number(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };
const clamp = (n, min = 0) => (isNaN(n) ? min : Math.max(min, n));

async function cargarMeserosAPI() {
  try {
    const data = await api.getMeseros();
    return (Array.isArray(data) ? data : []).map(u => ({ id: Number(u.id), nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim() || `Mesero ${u.id}` }));
  } catch (e) {
    return [];
  }
}

const Nominas = () => {
  const [nominas, setNominas] = useState([]);
  const [meseros, setMeseros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [fEstado, setFEstado] = useState('todos'); // todos | pendiente | pagado
  const [fMes, setFMes] = useState(''); // YYYY-MM
  const [sort, setSort] = useState({ by: 'inicio', dir: 'desc' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ empleadoId: '', inicio: '', fin: '', sueldoBase: '', extras: '', bonos: '', deducciones: '', estado: 'pendiente' });

  useEffect(() => {
    let cancel = false;
    async function load() {
      setCargando(true); setError('');
      try {
        const listaMeseros = await cargarMeserosAPI();
        if (!cancel) setMeseros(listaMeseros);
      } catch {}
      try {
        // Por defecto, cargar último mes
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth()+1).padStart(2,'0');
        const desde = `${y}-${m}-01`;
        const hasta = `${y}-${m}-31`;
        const data = await api.obtenerNomina('', desde, hasta);
        const rows = Array.isArray(data) ? data : [];
        // Agrupar por mesero + día (inicio/fin iguales)
        const map = new Map(); // key: mesero|yyyy-mm-dd
        for (const r of rows) {
          const dia = String(r.fecha).slice(0,10);
          const key = `${r.mesero_id}|${dia}`;
          if (!map.has(key)) {
            map.set(key, {
              id: r.id, // id de referencia
              empleadoId: r.mesero_id,
              inicio: dia,
              fin: dia,
              sueldoBase: 0,
              extras: 0,
              bonos: 0,
              deducciones: 0,
              estado: 'pendiente',
              createdAt: r.fecha,
              updatedAt: r.fecha,
              movementIds: { sueldo: [], extra: [], bono: [], deduccion: [], descuento: [], pago: [] },
            });
          }
          const g = map.get(key);
          const monto = Number(r.monto || 0);
          if (r.tipo === 'sueldo') { g.sueldoBase += monto; g.movementIds.sueldo.push(r.id); }
          else if (r.tipo === 'extra') { g.extras += monto; g.movementIds.extra.push(r.id); }
          else if (r.tipo === 'bono') { g.bonos += monto; g.movementIds.bono.push(r.id); }
          else if (r.tipo === 'deduccion') { g.deducciones += monto; g.movementIds.deduccion.push(r.id); }
          else if (r.tipo === 'descuento') { g.deducciones += monto; g.movementIds.descuento.push(r.id); }
          else if (r.tipo === 'pago') { g.estado = 'pagado'; g.movementIds.pago.push(r.id); }
          // track updatedAt latest
          g.updatedAt = r.fecha;
        }
        const grouped = Array.from(map.values());
        if (!cancel) setNominas(grouped);
      } catch (e) {
        if (!cancel) setError('No se pudo cargar la nómina');
      } finally {
        if (!cancel) setCargando(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, []);

  const nombreMesero = (id) => meseros.find(m => Number(m.id) === Number(id))?.nombre || `#${id}`;
  const totalDe = (n) => clamp(parseNum(n.sueldoBase)) + clamp(parseNum(n.extras)) + clamp(parseNum(n.bonos)) - clamp(parseNum(n.deducciones));

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let arr = nominas.filter(n => {
      const nEmpleado = nombreMesero(n.empleadoId).toLowerCase();
      const inText = !q || nEmpleado.includes(q);
      const estOk = fEstado === 'todos' || n.estado === fEstado;
      const mesOk = !fMes || (String(n.inicio).startsWith(fMes) || String(n.fin).startsWith(fMes));
      return inText && estOk && mesOk;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0) * dir;
    arr.sort((a, b) => {
      const k = sort.by;
      if (k === 'total') return cmp(totalDe(a), totalDe(b));
      if (k === 'empleado') return cmp(nombreMesero(a.empleadoId), nombreMesero(b.empleadoId));
      return cmp(String(a[k] || ''), String(b[k] || ''));
    });
    return arr;
  }, [nominas, meseros, busqueda, fEstado, fMes, sort]);

  const metrics = useMemo(() => {
    const total = nominas.length;
    const pagadas = nominas.filter(n => n.estado === 'pagado').length;
    const pendientes = total - pagadas;
    const totalAPagar = nominas.reduce((s, n) => s + totalDe(n), 0);
    const pagado = nominas.filter(n => n.estado === 'pagado').reduce((s, n) => s + totalDe(n), 0);
    return { total, pagadas, pendientes, totalAPagar, pagado };
  }, [nominas]);

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ empleadoId: meseros[0]?.id || '', inicio: new Date().toISOString().slice(0,10), fin: new Date().toISOString().slice(0,10), sueldoBase: '', extras: '', bonos: '', deducciones: '', estado: 'pendiente' });
    setShowModal(true);
  };
  const abrirEditar = (id) => {
    const n = nominas.find(x => x.id === id);
    if (!n) return;
    setEditId(id);
    setForm({ empleadoId: n.empleadoId, inicio: n.inicio, fin: n.fin, sueldoBase: String(n.sueldoBase), extras: String(n.extras), bonos: String(n.bonos), deducciones: String(n.deducciones), estado: n.estado });
    setShowModal(true);
  };
  const cerrarModal = () => setShowModal(false);

  const guardar = async () => {
    const empleadoId = Number(form.empleadoId);
    const inicio = String(form.inicio);
    const fin = String(form.fin);
    const sueldoBase = clamp(parseNum(form.sueldoBase));
    const extras = clamp(parseNum(form.extras));
    const bonos = clamp(parseNum(form.bonos));
    const deducciones = clamp(parseNum(form.deducciones));
    const estado = form.estado === 'pagado' ? 'pagado' : 'pendiente';

    if (!empleadoId) return Swal.fire({ icon: 'error', title: 'Seleccione un empleado' });
    if (!inicio || !fin) return Swal.fire({ icon: 'error', title: 'Periodo requerido' });
    if (new Date(inicio) > new Date(fin)) return Swal.fire({ icon: 'error', title: 'El inicio no puede ser mayor que el fin' });

    try {
      const fecha = inicio; // usar inicio como fecha del movimiento
      // Si es edición, eliminamos movimientos previos del mismo día (excepto pagos)
      if (editId) {
        try {
          const prev = await api.obtenerNomina(empleadoId, inicio, inicio);
          const prevRows = Array.isArray(prev) ? prev : [];
          const dels = prevRows
            .filter(r => r.tipo !== 'pago')
            .map(r => api.eliminarMovimientoNomina(r.id));
          if (dels.length) await Promise.allSettled(dels);
        } catch {}
      }
      // Crear movimientos por cada concepto > 0
      const ops = [];
      if (sueldoBase > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'sueldo', monto: sueldoBase, descripcion: 'Sueldo base', fecha }));
      if (extras > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'extra', monto: extras, descripcion: 'Horas extra', fecha }));
      if (bonos > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'bono', monto: bonos, descripcion: 'Bono', fecha }));
      if (deducciones > 0) ops.push(api.crearMovimientoNomina({ mesero_id: empleadoId, tipo: 'deduccion', monto: deducciones, descripcion: 'Deducción', fecha }));
      await Promise.all(ops);
      Swal.fire({ icon: 'success', title: 'Movimientos registrados', timer: 900, showConfirmButton: false });
      setShowModal(false);
      // Recargar lista del mes del inicio
      const y = String(inicio).slice(0,4);
      const m = String(inicio).slice(5,7);
      const desde = `${y}-${m}-01`;
      const hasta = `${y}-${m}-31`;
      const data = await api.obtenerNomina('', desde, hasta);
      const rows = Array.isArray(data) ? data : [];
      const map = new Map();
      for (const r of rows) {
        const dia = String(r.fecha).slice(0,10);
        const key = `${r.mesero_id}|${dia}`;
        if (!map.has(key)) {
          map.set(key, { id: r.id, empleadoId: r.mesero_id, inicio: dia, fin: dia, sueldoBase: 0, extras: 0, bonos: 0, deducciones: 0, estado: 'pendiente', createdAt: r.fecha, updatedAt: r.fecha, movementIds: { sueldo: [], extra: [], bono: [], deduccion: [], descuento: [], pago: [] } });
        }
        const g = map.get(key);
        const monto = Number(r.monto || 0);
        if (r.tipo === 'sueldo') { g.sueldoBase += monto; g.movementIds.sueldo.push(r.id); }
        else if (r.tipo === 'extra') { g.extras += monto; g.movementIds.extra.push(r.id); }
        else if (r.tipo === 'bono') { g.bonos += monto; g.movementIds.bono.push(r.id); }
        else if (r.tipo === 'deduccion') { g.deducciones += monto; g.movementIds.deduccion.push(r.id); }
        else if (r.tipo === 'descuento') { g.deducciones += monto; g.movementIds.descuento.push(r.id); }
        else if (r.tipo === 'pago') { g.estado = 'pagado'; g.movementIds.pago.push(r.id); }
      }
      setNominas(Array.from(map.values()));
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudo guardar', 'error');
    }
  };

  const eliminar = async (id) => {
    const n = nominas.find(x => x.id === id);
    if (!n) return;
    const res = await Swal.fire({ title: `Eliminar nómina de ${nombreMesero(n.empleadoId)}`, text: `${n.inicio}. Se eliminarán los conceptos del día (sin afectar pagos).`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      const ids = [
        ...(n.movementIds?.sueldo || []),
        ...(n.movementIds?.extra || []),
        ...(n.movementIds?.bono || []),
        ...(n.movementIds?.deduccion || []),
        ...(n.movementIds?.descuento || []),
      ];
      if (ids.length === 0) return setNominas(prev => prev.filter(x => x.id !== id));
      await Promise.allSettled(ids.map(mid => api.eliminarMovimientoNomina(mid)));
      setNominas(prev => prev.filter(x => x.id !== id));
      Swal.fire({ icon: 'success', title: 'Eliminado', timer: 900, showConfirmButton: false });
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudo eliminar', 'error');
    }
  };

  const marcarPago = async (id, pagar) => {
    const n = nominas.find(x => x.id === id);
    if (!n) return;
    try {
      if (pagar) {
        await api.marcarPagoNomina({ mesero_id: n.empleadoId, fecha: n.inicio, pagado: true, monto: totalDe(n), descripcion: `Pago nómina ${n.inicio} - ${n.fin}` });
        Swal.fire({ icon: 'success', title: 'Marcado como pagado', timer: 800, showConfirmButton: false });
        setNominas(prev => prev.map(x => x.id === id ? { ...x, estado: 'pagado' } : x));
      } else {
        await api.marcarPagoNomina({ mesero_id: n.empleadoId, fecha: n.inicio, pagado: false });
        Swal.fire({ icon: 'success', title: 'Marcado como pendiente', timer: 800, showConfirmButton: false });
        setNominas(prev => prev.map(x => x.id === id ? { ...x, estado: 'pendiente' } : x));
      }
    } catch (e) {
      Swal.fire('Error', e.message || 'No se pudo cambiar el estado', 'error');
    }
  };

  const exportarCSV = () => {
    const headers = ['Empleado','Inicio','Fin','SueldoBase','Extras','Bonos','Deducciones','Total','Estado','Creado','Actualizado'];
    const rows = nominas.map(n => [nombreMesero(n.empleadoId), n.inicio, n.fin, n.sueldoBase, n.extras, n.bonos, n.deducciones, totalDe(n), n.estado, n.createdAt, n.updatedAt]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nominas_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const restablecerDemo = async () => {
    Swal.fire({ icon: 'info', title: 'No disponible', text: 'Esta función de demo fue removida al migrar a la base de datos.' });
  };

  const toggleSort = (by) => setSort(prev => prev.by === by ? { by, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { by, dir: 'asc' });

  return (
    <div className="fin-page">
      <div className="fin-header">
        <h1>Finanzas · Nóminas</h1>
        <p className="muted">Gestión de pagos, deducciones y periodos.</p>
      </div>

      <div className="fin-metrics">
        <div className="metric-card"><div className="metric-icon"><HiReceiptPercent /></div><div className="metric-info"><div className="metric-value">{metrics.total}</div><div className="metric-label">Registros</div></div></div>
        <div className="metric-card"><div className="metric-icon"><HiClock /></div><div className="metric-info"><div className="metric-value">{metrics.pendientes}</div><div className="metric-label">Pendientes</div></div></div>
        <div className="metric-card"><div className="metric-icon"><HiCheckCircle /></div><div className="metric-info"><div className="metric-value">{metrics.pagadas}</div><div className="metric-label">Pagadas</div></div></div>
        <div className="metric-card"><div className="metric-icon"><HiCurrencyDollar /></div><div className="metric-info"><div className="metric-value">{toCurrency(metrics.totalAPagar)}</div><div className="metric-label">Total</div></div></div>
        <div className="metric-card"><div className="metric-icon"><HiBanknotes /></div><div className="metric-info"><div className="metric-value">{toCurrency(metrics.pagado)}</div><div className="metric-label">Pagado</div></div></div>
      </div>

      <div className="fin-card">
        <div className="toolbar">
          <div className="left">
            <button className="btn primary" onClick={abrirNuevo}>Nueva nómina</button>
          </div>
          <div className="right">
            <input className="input" placeholder="Buscar por empleado" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <select className="input" value={fEstado} onChange={e => setFEstado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
            <input className="input" type="month" value={fMes} onChange={e => setFMes(e.target.value)} />
            <button className="btn" onClick={exportarCSV}>Exportar CSV</button>
            <button className="btn danger" onClick={restablecerDemo}>Restablecer demo</button>
          </div>
        </div>

        {cargando ? (
          <div className="empty">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No hay nóminas que coincidan con los filtros.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="th-sortable" onClick={() => toggleSort('empleado')}>Empleado {sort.by==='empleado' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                  <th className="th-sortable" onClick={() => toggleSort('inicio')}>Inicio {sort.by==='inicio' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                  <th>Fin</th>
                  <th className="th-num">Sueldo</th>
                  <th className="th-num">Extras</th>
                  <th className="th-num">Bonos</th>
                  <th className="th-num">Deducciones</th>
                  <th className="th-num th-sortable" onClick={() => toggleSort('total')}>Total {sort.by==='total' ? (sort.dir==='asc'?'▲':'▼') : ''}</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id}>
                    <td>{nombreMesero(n.empleadoId)}</td>
                    <td>{n.inicio}</td>
                    <td>{n.fin}</td>
                    <td className="td-num">{toCurrency(n.sueldoBase)}</td>
                    <td className="td-num">{toCurrency(n.extras)}</td>
                    <td className="td-num">{toCurrency(n.bonos)}</td>
                    <td className="td-num">{toCurrency(n.deducciones)}</td>
                    <td className="td-num"><span className="chip info">{toCurrency(totalDe(n))}</span></td>
                    <td>
                      <span className={`status ${n.estado === 'pagado' ? 'on' : 'off'}`}>
                        <span className="dot" /> {n.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn sm" onClick={() => abrirEditar(n.id)}>Editar</button>
                        {n.estado === 'pagado' ? (
                          <button className="btn sm" onClick={() => marcarPago(n.id, false)}>Marcar pendiente</button>
                        ) : (
                          <button className="btn sm" onClick={() => marcarPago(n.id, true)}>Marcar pagado</button>
                        )}
                        <button className="btn sm danger" onClick={() => eliminar(n.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card lg">
            <div className="modal-header">
              <h3>{editId ? 'Editar nómina' : 'Nueva nómina'}</h3>
              <button className="icon-btn" onClick={() => setShowModal(false)} aria-label="Cerrar"><HiXMark /></button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">Registra el periodo y los conceptos de pago.</p>
              <div className="form-grid">
                <label>
                  <span>Empleado</span>
                  <select value={form.empleadoId} onChange={e => setForm(f => ({ ...f, empleadoId: Number(e.target.value) }))}>
                    {meseros.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </label>
                <label>
                  <span>Inicio</span>
                  <input type="date" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
                </label>
                <label>
                  <span>Fin</span>
                  <input type="date" value={form.fin} onChange={e => setForm(f => ({ ...f, fin: e.target.value }))} />
                </label>
                <label>
                  <span>Sueldo base</span>
                  <input type="number" inputMode="decimal" min="0" value={form.sueldoBase} onChange={e => setForm(f => ({ ...f, sueldoBase: e.target.value }))} />
                </label>
                <label>
                  <span>Extras</span>
                  <input type="number" inputMode="decimal" min="0" value={form.extras} onChange={e => setForm(f => ({ ...f, extras: e.target.value }))} />
                </label>
                <label>
                  <span>Bonos</span>
                  <input type="number" inputMode="decimal" min="0" value={form.bonos} onChange={e => setForm(f => ({ ...f, bonos: e.target.value }))} />
                </label>
                <label>
                  <span>Deducciones</span>
                  <input type="number" inputMode="decimal" min="0" value={form.deducciones} onChange={e => setForm(f => ({ ...f, deducciones: e.target.value }))} />
                </label>
                <label className="switch">
                  <input type="checkbox" checked={form.estado === 'pagado'} onChange={e => setForm(f => ({ ...f, estado: e.target.checked ? 'pagado' : 'pendiente' }))} />
                  <span>Pagado</span>
                </label>
              </div>
              <div className="resume-row">
                <div><strong>Total estimado:</strong> {toCurrency(totalDe({ sueldoBase: parseNum(form.sueldoBase), extras: parseNum(form.extras), bonos: parseNum(form.bonos), deducciones: parseNum(form.deducciones) }))}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn primary" onClick={guardar}>{editId ? 'Guardar cambios' : 'Crear nómina'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nominas;
