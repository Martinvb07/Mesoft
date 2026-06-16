import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import {
    HiOutlineCog6Tooth, HiOutlineCloudArrowDown, HiOutlineCloudArrowUp, HiOutlineArrowPath,
    HiOutlineShieldCheck, HiOutlinePaintBrush, HiOutlineBuildingStorefront, HiOutlineCreditCard,
    HiOutlineDocumentText, HiOutlineBell,
} from 'react-icons/hi2';
import { api } from '../../../../api/client';
import Select from '../../ui/Select';

const SETTINGS_KEY = 'app_settings_v1';

const defaultSettings = Object.freeze({
    businessName: 'Mi Restaurante',
    currency: 'COP',
    locale: 'es-CO',
    theme: 'system',
    brandColor: '#ff6633',
    tipsEnabled: true,
    taxPercent: 0,
    defaultTables: 16,
    allowReservations: true,
    notifyEmail: true,
    notifyDesktop: false,
    inventoryLowStockThreshold: 5,
    payrollPayday: 15,
    backupsAuto: false,
    adminPIN: '',
    pinApertura: '',
    metaSemanal: 0,
    metaMensual: 0,
});

function safeParse(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}
function saveSettingsToStorage(settings) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function loadSettingsFromStorage() {
    const s = safeParse(SETTINGS_KEY, null);
    if (!s) return { ...defaultSettings };
    return { ...defaultSettings, ...s };
}
function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}

/* ─── helpers de presentación (alineados con Inicio / Mesas) ─── */
const cardBase = 'rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-lg shadow-slate-200/60';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60';
const btnDanger = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50';
const inputCls = 'w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400';
const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400';

const gridStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const itemUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function SectionCard({ icon: Icon, title, children, className = '' }) {
    return (
        <motion.div variants={itemUp} className={`${cardBase} ${className}`}>
            <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Icon className="h-5 w-5" /></span>
                <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

function Field({ label, children }) {
    return <div><label className={labelCls}>{label}</label>{children}</div>;
}

function Toggle({ checked, onChange, label }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-100 transition-colors hover:bg-slate-100">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
        </button>
    );
}

const Configuracion = () => {
    const [settings, setSettings] = useState(defaultSettings);
    const fileRef = useRef(null);

    // Integraciones de pago y DIAN
    const [integ, setInteg] = useState({
        wompi_public_key: '', bold_api_key: '', alegra_email: '', alegra_api_key: '', alegra_configurado: false,
    });
    const [integLoading, setIntegLoading] = useState(false);

    useEffect(() => {
        api.getRestaurante().then(r => {
            if (r) setInteg({
                wompi_public_key: r.wompi_public_key || '',
                bold_api_key: r.bold_api_key || '',
                alegra_email: r.alegra_email || '',
                alegra_api_key: r.alegra_api_key || '',
                alegra_configurado: !!r.alegra_configurado,
            });
        }).catch(() => {});
    }, []);

    const saveInteg = async () => {
        setIntegLoading(true);
        try {
            await api.actualizarRestaurante({
                wompi_public_key: integ.wompi_public_key || null,
                bold_api_key: integ.bold_api_key || null,
                alegra_email: integ.alegra_email || null,
                alegra_api_key: integ.alegra_api_key || null,
            });
            Swal.fire({ icon: 'success', title: 'Integraciones guardadas', timer: 1500, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', e?.message || 'No se pudo guardar', 'error');
        } finally {
            setIntegLoading(false);
        }
    };

    useEffect(() => { setSettings(loadSettingsFromStorage()); }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (settings.theme === 'system') root.removeAttribute('data-theme');
        else root.setAttribute('data-theme', settings.theme);
    }, [settings.theme]);

    const currencyOptions = useMemo(() => (['COP', 'MXN', 'USD', 'EUR', 'CLP', 'ARS', 'PEN', 'BRL']), []);
    const localeOptions = useMemo(() => ([
        { value: 'es-CO', label: 'Español (Colombia)' },
        { value: 'es-MX', label: 'Español (México)' },
        { value: 'es-ES', label: 'Español (España)' },
        { value: 'en-US', label: 'English (US)' },
        { value: 'pt-BR', label: 'Português (Brasil)' },
    ]), []);

    const onChange = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

    const save = async () => {
        if (!settings.businessName?.trim()) return Swal.fire('Nombre requerido', 'Ingresa el nombre del comercio.', 'warning');
        if (settings.taxPercent < 0 || settings.taxPercent > 99) return Swal.fire('Impuesto inválido', 'El impuesto debe estar entre 0% y 99%.', 'warning');
        if (settings.defaultTables < 0 || settings.defaultTables > 500) return Swal.fire('Mesas inválidas', 'Define un número razonable de mesas (0-500).', 'warning');
        if (settings.inventoryLowStockThreshold < 0 || settings.inventoryLowStockThreshold > 9999) return Swal.fire('Umbral inválido', 'El umbral de bajo stock debe ser 0-9999.', 'warning');
        if (settings.payrollPayday < 1 || settings.payrollPayday > 31) return Swal.fire('Día de pago inválido', 'El día de nómina debe estar entre 1 y 31.', 'warning');
        saveSettingsToStorage(settings);
        await Swal.fire('Guardado', 'La configuración ha sido actualizada.', 'success');
    };

    const [backupLoading, setBackupLoading] = useState(false);
    const [backupPreview, setBackupPreview] = useState(null);
    const importJsonRef = useRef(null);

    const exportBackup = async () => {
        setBackupLoading(true);
        try {
            const [productosRes, meserosRes, mesasRes, facturasRes] = await Promise.allSettled([
                api.getProductos(), api.getMeseros(), api.getMesas(), api.facturas({ limit: 500 }),
            ]);
            const productos = productosRes.status === 'fulfilled'
                ? (Array.isArray(productosRes.value?.items) ? productosRes.value.items : Array.isArray(productosRes.value) ? productosRes.value : safeParse('inventario_productos_v1', []))
                : safeParse('inventario_productos_v1', []);
            const meseros = meserosRes.status === 'fulfilled' ? (Array.isArray(meserosRes.value) ? meserosRes.value : safeParse('usuarios', [])) : safeParse('usuarios', []);
            const mesas = mesasRes.status === 'fulfilled' ? (Array.isArray(mesasRes.value) ? mesasRes.value : safeParse('mesas_data_v1', [])) : safeParse('mesas_data_v1', []);
            const facturas = facturasRes.status === 'fulfilled' ? (Array.isArray(facturasRes.value) ? facturasRes.value : []) : [];
            const backup = {
                version: 2, exportedAt: new Date().toISOString(), settings,
                data: { productos, meseros, mesas, facturas, nominas: safeParse('fin_nominas_v1', []) },
            };
            const today = new Date().toISOString().slice(0, 10);
            downloadJson(`mesoft-backup-${today}.json`, backup);
            Swal.fire({ icon: 'success', title: 'Backup exportado', text: `${productos.length} productos, ${mesas.length} mesas, ${facturas.length} facturas.`, timer: 2500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo generar el backup completo.', 'error');
        } finally {
            setBackupLoading(false);
        }
    };

    const onImportClick = () => fileRef.current?.click();
    const onImportBackupClick = () => importJsonRef.current?.click();

    const importBackup = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (!json || typeof json !== 'object' || !json.settings) return Swal.fire('Archivo inválido', 'El JSON no contiene un objeto de configuración válido.', 'error');
            const { settings: newSettings, data } = json;
            const confirm = await Swal.fire({ title: 'Importar backup', text: 'Esto sobrescribirá la configuración actual y datos (si están presentes).', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, importar', cancelButtonText: 'Cancelar' });
            if (!confirm.isConfirmed) return;
            const merged = { ...defaultSettings, ...newSettings };
            saveSettingsToStorage(merged); setSettings(merged);
            if (data && typeof data === 'object') {
                if (Array.isArray(data.inventario)) localStorage.setItem('inventario_productos_v1', JSON.stringify(data.inventario));
                if (Array.isArray(data.nominas)) localStorage.setItem('fin_nominas_v1', JSON.stringify(data.nominas));
                if (Array.isArray(data.usuarios)) localStorage.setItem('usuarios', JSON.stringify(data.usuarios));
                if (Array.isArray(data.mesas)) localStorage.setItem('mesas_data_v1', JSON.stringify(data.mesas));
            }
            await Swal.fire('Importado', 'Se aplicó el backup correctamente.', 'success');
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudo importar el archivo. Verifica el formato JSON.', 'error');
        }
    };

    const importFullBackup = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            const json = JSON.parse(text);
            if (!json || typeof json !== 'object') return Swal.fire('Archivo inválido', 'El archivo no es un backup válido de Mesoft.', 'error');
            const { data } = json;
            const preview = [
                data?.productos ? `${data.productos.length} productos` : null,
                data?.mesas ? `${data.mesas.length} mesas` : null,
                data?.meseros ? `${data.meseros.length} meseros` : null,
                data?.facturas ? `${data.facturas.length} facturas` : null,
            ].filter(Boolean).join(', ');
            setBackupPreview({ json, preview });
        } catch {
            Swal.fire('Error', 'No se pudo leer el archivo de backup.', 'error');
        }
    };

    const aplicarBackupPreview = async () => {
        if (!backupPreview) return;
        const { json } = backupPreview;
        const confirm = await Swal.fire({ title: 'Importar backup', text: `Se importarán: ${backupPreview.preview}. Esto sobrescribirá los datos locales.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, importar', cancelButtonText: 'Cancelar' });
        if (!confirm.isConfirmed) return;
        if (json.settings) {
            const merged = { ...defaultSettings, ...json.settings };
            saveSettingsToStorage(merged); setSettings(merged);
        }
        const d = json.data || {};
        if (Array.isArray(d.productos)) localStorage.setItem('inventario_productos_v1', JSON.stringify(d.productos));
        if (Array.isArray(d.nominas)) localStorage.setItem('fin_nominas_v1', JSON.stringify(d.nominas));
        if (Array.isArray(d.meseros)) localStorage.setItem('usuarios', JSON.stringify(d.meseros));
        if (Array.isArray(d.mesas)) localStorage.setItem('mesas_data_v1', JSON.stringify(d.mesas));
        setBackupPreview(null);
        Swal.fire('Importado', 'Backup aplicado correctamente.', 'success');
    };

    const resetDefaults = async () => {
        const confirm = await Swal.fire({ title: 'Restablecer configuración', text: 'Volverás a los valores por defecto. ¿Continuar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, restablecer', cancelButtonText: 'Cancelar' });
        if (!confirm.isConfirmed) return;
        const copy = { ...defaultSettings };
        saveSettingsToStorage(copy); setSettings(copy);
        Swal.fire('Listo', 'Se restablecieron los valores por defecto.', 'success');
    };

    const clearData = async () => {
        const confirm = await Swal.fire({ title: 'Limpiar datos locales', html: 'Se eliminarán Inventario y Nóminas locales.<br/>Opcionalmente, también usuarios y mesas.', icon: 'warning', input: 'checkbox', inputValue: 0, inputPlaceholder: 'Incluir usuarios y mesas', showCancelButton: true, confirmButtonText: 'Sí, limpiar', cancelButtonText: 'Cancelar' });
        if (!confirm.isConfirmed) return;
        localStorage.removeItem('inventario_productos_v1');
        localStorage.removeItem('fin_nominas_v1');
        if (confirm.value) {
            localStorage.removeItem('usuarios');
            localStorage.removeItem('mesas_data_v1');
        }
        Swal.fire('Hecho', 'Datos locales eliminados.', 'success');
    };

    const logoutAll = async () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_session');
        await Swal.fire('Sesiones cerradas', 'Se invalidaron credenciales locales. Si usas backend, asegúrate de cerrar sesión allí también.', 'info');
    };

    return (
        <div className="ms-config mx-auto max-w-7xl">
            <style>{`:where(.ms-config) button{-webkit-appearance:none;appearance:none;border:0;background-color:transparent;cursor:pointer;font:inherit;color:inherit;}`}</style>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Sistema</span>
                    <h1 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Configuración</h1>
                    <p className="m-0 mt-1 text-sm text-slate-500">Preferencias del sistema y datos locales</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button className={btnGhost} onClick={resetDefaults}><HiOutlineArrowPath className="h-4 w-4" /> Restablecer</button>
                    <button className={btnGhost} onClick={onImportClick}><HiOutlineCloudArrowUp className="h-4 w-4" /> Importar config</button>
                    <button className={btnGhost} onClick={onImportBackupClick} disabled={backupLoading}><HiOutlineCloudArrowUp className="h-4 w-4" /> Importar backup</button>
                    <button className={btnGhost} onClick={exportBackup} disabled={backupLoading}><HiOutlineCloudArrowDown className="h-4 w-4" /> {backupLoading ? 'Exportando…' : 'Exportar backup'}</button>
                    <button className={btnPrimary} onClick={save}>Guardar cambios</button>
                    <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importBackup} />
                    <input ref={importJsonRef} type="file" accept="application/json" className="hidden" onChange={importFullBackup} />
                </div>
            </motion.div>

            <motion.div
                variants={gridStagger}
                initial="hidden"
                animate="visible"
                className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2"
            >
                {/* General */}
                <SectionCard icon={HiOutlineBuildingStorefront} title="General">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field label="Nombre del comercio">
                                <input className={inputCls} type="text" value={settings.businessName} onChange={e => onChange('businessName', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Moneda">
                            <Select className="w-full" value={settings.currency} onChange={e => onChange('currency', e.target.value)}>
                                {currencyOptions.map(c => (<option key={c} value={c}>{c}</option>))}
                            </Select>
                        </Field>
                        <Field label="Idioma / Región">
                            <Select className="w-full" value={settings.locale} onChange={e => onChange('locale', e.target.value)}>
                                {localeOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                            </Select>
                        </Field>
                        <Field label="Mesas por defecto">
                            <input className={inputCls} type="number" min={0} max={500} value={settings.defaultTables} onChange={e => onChange('defaultTables', Number(e.target.value))} />
                        </Field>
                    </div>
                    <div className="mt-4">
                        <Toggle checked={settings.allowReservations} onChange={v => onChange('allowReservations', v)} label="Permitir reservas" />
                    </div>
                </SectionCard>

                {/* Apariencia */}
                <SectionCard icon={HiOutlinePaintBrush} title="Apariencia">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Tema">
                            <Select className="w-full" value={settings.theme} onChange={e => onChange('theme', e.target.value)}>
                                <option value="system">Seguir sistema</option>
                                <option value="light">Claro</option>
                                <option value="dark">Oscuro</option>
                            </Select>
                        </Field>
                        <Field label="Color de marca">
                            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                                <input type="color" value={settings.brandColor} onChange={e => onChange('brandColor', e.target.value)} className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                                <span className="text-sm font-semibold text-slate-700">{settings.brandColor}</span>
                            </div>
                        </Field>
                    </div>
                    <p className="m-0 mt-3 text-xs text-slate-400">El color de marca se aplicará gradualmente en los módulos con tokens.</p>
                </SectionCard>

                {/* Operación */}
                <SectionCard icon={HiOutlineShieldCheck} title="Operación" className="lg:col-span-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Impuesto (%)">
                            <input className={inputCls} type="number" min={0} max={99} value={settings.taxPercent} onChange={e => onChange('taxPercent', Number(e.target.value))} />
                        </Field>
                        <Field label="Umbral bajo stock">
                            <input className={inputCls} type="number" min={0} max={9999} value={settings.inventoryLowStockThreshold} onChange={e => onChange('inventoryLowStockThreshold', Number(e.target.value))} />
                        </Field>
                        <Field label="Día de pago nómina">
                            <input className={inputCls} type="number" min={1} max={31} value={settings.payrollPayday} onChange={e => onChange('payrollPayday', Number(e.target.value))} />
                        </Field>
                        <Field label="PIN administrador (opcional)">
                            <input className={inputCls} type="password" value={settings.adminPIN} onChange={e => onChange('adminPIN', e.target.value)} placeholder="••••" />
                        </Field>
                        <Field label="PIN de apertura de turno (4 dígitos)">
                            <input className={inputCls} type="password" maxLength={4} value={settings.pinApertura} onChange={e => onChange('pinApertura', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="0000" />
                        </Field>
                        <Field label="Meta semanal ($)">
                            <input className={inputCls} type="number" min={0} value={settings.metaSemanal} onChange={e => onChange('metaSemanal', Number(e.target.value))} />
                        </Field>
                        <Field label="Meta mensual ($)">
                            <input className={inputCls} type="number" min={0} value={settings.metaMensual} onChange={e => onChange('metaMensual', Number(e.target.value))} />
                        </Field>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Toggle checked={settings.tipsEnabled} onChange={v => onChange('tipsEnabled', v)} label="Habilitar propinas" />
                        <Toggle checked={settings.backupsAuto} onChange={v => onChange('backupsAuto', v)} label="Backups automáticos" />
                    </div>
                </SectionCard>

                {/* Integraciones de pago */}
                <SectionCard icon={HiOutlineCreditCard} title="Integraciones de pago">
                    <div className="space-y-4">
                        <Field label="Wompi — Public Key">
                            <input className={inputCls} type="text" placeholder="pub_prod_..." value={integ.wompi_public_key} onChange={e => setInteg(prev => ({ ...prev, wompi_public_key: e.target.value }))} />
                        </Field>
                        <Field label="Bold — API Key">
                            <input className={inputCls} type="text" placeholder="bold_sk_..." value={integ.bold_api_key} onChange={e => setInteg(prev => ({ ...prev, bold_api_key: e.target.value }))} />
                        </Field>
                    </div>
                    <p className="m-0 mt-3 text-xs text-slate-400">Los links de pago aparecerán automáticamente en la factura al cerrar una cuenta.</p>
                    <button className={`${btnPrimary} mt-4`} onClick={saveInteg} disabled={integLoading}>{integLoading ? 'Guardando…' : 'Guardar integraciones'}</button>
                </SectionCard>

                {/* Facturación DIAN (Alegra) */}
                <SectionCard icon={HiOutlineDocumentText} title="Facturación electrónica DIAN (Alegra)">
                    <div className="space-y-4">
                        <Field label="Email de Alegra">
                            <input className={inputCls} type="email" placeholder="tucuenta@empresa.com" value={integ.alegra_email} onChange={e => setInteg(prev => ({ ...prev, alegra_email: e.target.value }))} />
                        </Field>
                        <Field label="API Key de Alegra">
                            <input className={inputCls} type="password" placeholder="••••••••••••••••" value={integ.alegra_api_key} onChange={e => setInteg(prev => ({ ...prev, alegra_api_key: e.target.value }))} />
                        </Field>
                    </div>
                    <p className="m-0 mt-3 text-xs text-slate-400">Obtén tu API key en Alegra → Configuración → API → Generar token.</p>
                    <div className="mt-4 flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${integ.alegra_configurado ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${integ.alegra_configurado ? 'bg-emerald-500' : 'bg-slate-400'}`} /> {integ.alegra_configurado ? 'Configurado' : 'Sin configurar'}
                        </span>
                        <button className={btnPrimary} onClick={saveInteg} disabled={integLoading}>{integLoading ? 'Guardando…' : 'Guardar'}</button>
                    </div>
                </SectionCard>

                {/* Notificaciones y seguridad */}
                <SectionCard icon={HiOutlineBell} title="Notificaciones y seguridad" className="lg:col-span-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Toggle checked={settings.notifyEmail} onChange={v => onChange('notifyEmail', v)} label="Notificar por email" />
                        <Toggle checked={settings.notifyDesktop} onChange={v => onChange('notifyDesktop', v)} label="Notificar en escritorio" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        <button className={btnGhost} onClick={logoutAll}>Cerrar sesiones</button>
                        <button className={btnDanger} onClick={clearData}>Limpiar datos</button>
                    </div>
                </SectionCard>
            </motion.div>

            {/* Backup preview */}
            {backupPreview && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mx-auto mt-5 max-w-2xl ${cardBase}`}
                >
                    <h3 className="m-0 text-base font-extrabold tracking-tight text-slate-900">Vista previa del backup</h3>
                    <p className="m-0 mt-1 text-sm text-slate-500">Contenido detectado: <strong className="text-slate-700">{backupPreview.preview}</strong></p>
                    <div className="mt-4 flex gap-2">
                        <button className={btnPrimary} onClick={aplicarBackupPreview}>Aplicar backup</button>
                        <button className={btnGhost} onClick={() => setBackupPreview(null)}>Cancelar</button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Configuracion;
