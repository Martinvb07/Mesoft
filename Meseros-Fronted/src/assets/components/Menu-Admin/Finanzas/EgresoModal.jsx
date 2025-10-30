import React, { useEffect, useState } from 'react';
import '../../../css/Navbar/Menu-Admin/Finanzas/EgresosModal.css';

// Modal para crear egreso (presentacional + validación básica)
// Props:
// - open: boolean
// - onClose: fn()
// - onSubmit: fn(payload) -> Promise (crea egreso en backend)
// - defaultDate: string (YYYY-MM-DD)
// - defaultCategoria: string
// - titulo: string
export default function EgresoModal({ open, onClose, onSubmit, defaultDate, defaultCategoria = '', titulo = 'Nuevo Egreso' }) {
  const [form, setForm] = useState({ concepto: '', monto: '', fecha: defaultDate || new Date().toISOString().slice(0,10), categoria: defaultCategoria, descripcion: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    if (open) {
      setForm({ concepto: '', monto: '', fecha: defaultDate || new Date().toISOString().slice(0,10), categoria: defaultCategoria, descripcion: '' });
      setError('');
      setSaving(false);
    }
  }, [open, defaultDate, defaultCategoria]);

  if (!open) return null;

  const submit = async ()=>{
    setError('');
    const concepto = String(form.concepto || '').trim();
    const monto = Number(form.monto);
    const fecha = form.fecha;
    const categoria = form.categoria;
    const descripcion = String(form.descripcion || '').trim();
    if (!concepto) return setError('Concepto requerido');
    if (!monto || isNaN(monto) || monto <= 0) return setError('Monto inválido');
    if (!fecha) return setError('Fecha requerida');
    if (!categoria) return setError('Categoría requerida');
    try {
      setSaving(true);
      await onSubmit({ concepto, monto, fecha, categoria, descripcion });
      setSaving(false);
      onClose?.();
    } catch (e) {
      setSaving(false);
      setError(e?.message || 'No se pudo guardar el egreso');
    }
  };

  return (
    <div className="modal-overlay finz-modal" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{titulo}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-body">
          {error && <div className="finz-alert">{error}</div>}
          <div className="form-grid">
            <label className="fld">Concepto *
              <input type="text" placeholder="Ej: Pago de servicios" value={form.concepto} onChange={e=>setForm(f=>({...f, concepto:e.target.value}))} />
            </label>
            <label className="fld">Monto *
              <input type="number" step="0.01" value={form.monto} onChange={e=>setForm(f=>({...f, monto:e.target.value}))} />
            </label>
            <label className="fld">Categoría *
              <select value={form.categoria} onChange={e=>setForm(f=>({...f, categoria:e.target.value}))}>
                <option value="">Seleccione…</option>
                <option>Gastos Operativos</option>
                <option>Servicios</option>
                <option>Arriendo</option>
                <option>Inventario</option>
                <option>Otros</option>
              </select>
            </label>
            <label className="fld">Fecha *
              <input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f, fecha:e.target.value}))} />
            </label>
            <label className="fld full">Descripción
              <textarea rows={4} placeholder="Detalles adicionales del egreso..." value={form.descripcion} onChange={e=>setForm(f=>({...f, descripcion:e.target.value}))}></textarea>
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
}
