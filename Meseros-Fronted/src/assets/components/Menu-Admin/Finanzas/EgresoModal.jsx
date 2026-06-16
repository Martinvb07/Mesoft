import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiXMark } from 'react-icons/hi2';
import Select from '../../ui/Select';
import DatePicker from '../../ui/DatePicker';

const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

// Modal para crear egreso (presentacional + validación básica)
// Props: open, onClose, onSubmit(payload), defaultDate, defaultCategoria, titulo
export default function EgresoModal({ open, onClose, onSubmit, defaultDate, defaultCategoria = '', titulo = 'Nuevo egreso' }) {
  const [form, setForm] = useState({ concepto: '', monto: '', fecha: defaultDate || new Date().toISOString().slice(0, 10), categoria: defaultCategoria, descripcion: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ concepto: '', monto: '', fecha: defaultDate || new Date().toISOString().slice(0, 10), categoria: defaultCategoria, descripcion: '' });
      setError('');
      setSaving(false);
    }
  }, [open, defaultDate, defaultCategoria]);

  if (!open) return null;

  const submit = async () => {
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
    <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="ms-egreso-modal flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
      >
        <style>{`:where(.ms-egreso-modal) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{titulo}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 ring-1 ring-red-100">{error}</div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Concepto *</label>
              <input type="text" className={inputCls} placeholder="Ej: Pago de servicios" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Monto *</label>
              <input type="number" step="0.01" className={inputCls} placeholder="0" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Categoría *</label>
              <Select className="w-full" placeholder="Seleccione…" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                <option value="">Seleccione…</option>
                <option>Gastos Operativos</option>
                <option>Servicios</option>
                <option>Arriendo</option>
                <option>Inventario</option>
                <option>Otros</option>
              </Select>
            </div>
            <div>
              <label className={labelCls}>Fecha *</label>
              <DatePicker className="w-full" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Descripción</label>
              <textarea rows={4} className={`${inputCls} resize-y`} placeholder="Detalles adicionales del egreso…" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button className={btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
          <button className={btnPrimary} onClick={submit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar egreso'}</button>
        </div>
      </motion.div>
    </div>
  );
}
