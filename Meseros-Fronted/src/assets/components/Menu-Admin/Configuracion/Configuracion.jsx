import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { HiCog6Tooth, HiCloudArrowDown, HiCloudArrowUp, HiArrowPath, HiShieldCheck, HiPaintBrush, HiBuildingStorefront } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Configuracion/Configuracion.css';

const SETTINGS_KEY = 'app_settings_v1';

const defaultSettings = Object.freeze({
    businessName: 'Mi Restaurante',
    currency: 'COP',
    locale: 'es-CO',
    theme: 'system', // system | light | dark
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
    adminPIN: ''
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

function saveSettingsToStorage(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettingsFromStorage() {
    const s = safeParse(SETTINGS_KEY, null);
    if (!s) return { ...defaultSettings };
    return { ...defaultSettings, ...s };
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

const Configuracion = () => {
    const [settings, setSettings] = useState(defaultSettings);
    const fileRef = useRef(null);

    useEffect(() => {
      setSettings(loadSettingsFromStorage());
  }, []);

  useEffect(() => {
      // Aplicar preferencia de tema (opcional: otros módulos pueden aprovecharlo más tarde)
      const root = document.documentElement;
      if (settings.theme === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', settings.theme);
      }
  }, [settings.theme]);

  const currencyOptions = useMemo(() => (
      ['COP','MXN','USD','EUR','CLP','ARS','PEN','BRL']
  ), []);

  const localeOptions = useMemo(() => (
      [
        { value: 'es-CO', label: 'Español (Colombia)' },
        { value: 'es-MX', label: 'Español (México)' },
        { value: 'es-ES', label: 'Español (España)' },
        { value: 'en-US', label: 'English (US)' },
        { value: 'pt-BR', label: 'Português (Brasil)' }
      ]
  ), []);

  const onChange = (field, value) => {
      setSettings(prev => ({ ...prev, [field]: value }));
  };

  const save = async () => {
      // Validaciones simples
      if (!settings.businessName?.trim()) {
        return Swal.fire('Nombre requerido', 'Ingresa el nombre del comercio.', 'warning');
      }
      if (settings.taxPercent < 0 || settings.taxPercent > 99) {
        return Swal.fire('Impuesto inválido', 'El impuesto debe estar entre 0% y 99%.', 'warning');
      }
      if (settings.defaultTables < 0 || settings.defaultTables > 500) {
        return Swal.fire('Mesas inválidas', 'Define un número razonable de mesas (0-500).', 'warning');
      }
      if (settings.inventoryLowStockThreshold < 0 || settings.inventoryLowStockThreshold > 9999) {
        return Swal.fire('Umbral inválido', 'El umbral de bajo stock debe ser 0-9999.', 'warning');
      }
      if (settings.payrollPayday < 1 || settings.payrollPayday > 31) {
        return Swal.fire('Día de pago inválido', 'El día de nómina debe estar entre 1 y 31.', 'warning');
    }

      saveSettingsToStorage(settings);
      await Swal.fire('Guardado', 'La configuración ha sido actualizada.', 'success');
  };

  const exportBackup = () => {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        data: {
          inventario: safeParse('inventario_productos_v1', []),
          nominas: safeParse('fin_nominas_v1', []),
          usuarios: safeParse('usuarios', []),
          mesas: safeParse('mesas_data_v1', [])
        }
      };
      const filename = `backup-mesoft-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
      downloadJson(filename, backup);
  };

  const onImportClick = () => fileRef.current?.click();

  const importBackup = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        if (!json || typeof json !== 'object' || !json.settings) {
          return Swal.fire('Archivo inválido', 'El JSON no contiene un objeto de configuración válido.', 'error');
        }
        const { settings: newSettings, data } = json;
        const confirm = await Swal.fire({
          title: 'Importar backup',
          text: 'Esto sobrescribirá la configuración actual y datos (si están presentes).',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, importar',
          cancelButtonText: 'Cancelar'
        });
        if (!confirm.isConfirmed) return;

        // Aplicar settings
        const merged = { ...defaultSettings, ...newSettings };
        saveSettingsToStorage(merged);
        setSettings(merged);

        // Aplicar datos si existen
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

  const resetDefaults = async () => {
    const confirm = await Swal.fire({
      title: 'Restablecer configuración',
      text: 'Volverás a los valores por defecto. ¿Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;
    const copy = { ...defaultSettings };
    saveSettingsToStorage(copy);
    setSettings(copy);
    Swal.fire('Listo', 'Se restablecieron los valores por defecto.', 'success');
  };

  const clearData = async () => {
    const confirm = await Swal.fire({
      title: 'Limpiar datos locales',
      html: 'Se eliminarán Inventario y Nóminas locales.<br/>Opcionalmente, también usuarios y mesas.',
      icon: 'warning',
      input: 'checkbox',
      inputValue: 0,
      inputPlaceholder: 'Incluir usuarios y mesas',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });
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
    <div className="config-page">
      <header className="config-header">
        <div className="title-wrap">
          <div className="title-icon"><HiCog6Tooth /></div>
          <div>
            <h1>Configuración</h1>
            <div className="muted">Preferencias del sistema y datos locales</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={resetDefaults}><HiArrowPath /> Restablecer</button>
          <button className="btn" onClick={onImportClick}><HiCloudArrowUp /> Importar</button>
          <button className="btn" onClick={exportBackup}><HiCloudArrowDown /> Exportar</button>
          <button className="btn primary" onClick={save}>Guardar cambios</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importBackup} />
        </div>
      </header>

      <section className="config-grid">
        {/* General */}
        <div className="config-card">
          <div className="card-header"><HiBuildingStorefront /> General</div>
          <div className="card-body form-grid">
            <label>
              <span>Nombre del comercio</span>
              <input className="input" type="text" value={settings.businessName} onChange={e => onChange('businessName', e.target.value)} />
            </label>
            <label>
              <span>Moneda</span>
              <select className="input" value={settings.currency} onChange={e => onChange('currency', e.target.value)}>
                {currencyOptions.map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
            </label>
            <label>
              <span>Idioma/Región</span>
              <select className="input" value={settings.locale} onChange={e => onChange('locale', e.target.value)}>
                {localeOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </label>
            <label>
              <span>Mesas por defecto</span>
              <input className="input" type="number" min={0} max={500} value={settings.defaultTables} onChange={e => onChange('defaultTables', Number(e.target.value))} />
            </label>
          </div>
          <div className="row">
            <label className="switch">
              <input type="checkbox" checked={settings.allowReservations} onChange={e => onChange('allowReservations', e.target.checked)} />
              <span className="slider" />
              <span>Permitir reservas</span>
            </label>
          </div>
        </div>

        {/* Apariencia */}
        <div className="config-card">
          <div className="card-header"><HiPaintBrush /> Apariencia</div>
          <div className="card-body form-grid">
            <label>
              <span>Tema</span>
              <select className="input" value={settings.theme} onChange={e => onChange('theme', e.target.value)}>
                <option value="system">Seguir sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>
            </label>
            <label>
              <span>Color de marca</span>
              <input className="input" type="color" value={settings.brandColor} onChange={e => onChange('brandColor', e.target.value)} />
            </label>
          </div>
          <div className="muted small">El color de marca se usará gradualmente en módulos; hoy aplica a componentes con tokens.</div>
        </div>

        {/* Operación */}
        <div className="config-card">
          <div className="card-header"><HiShieldCheck /> Operación</div>
          <div className="card-body form-grid">
            <label>
              <span>Impuesto (%)</span>
              <input className="input" type="number" min={0} max={99} value={settings.taxPercent} onChange={e => onChange('taxPercent', Number(e.target.value))} />
            </label>
            <label>
              <span>Umbral bajo stock</span>
              <input className="input" type="number" min={0} max={9999} value={settings.inventoryLowStockThreshold} onChange={e => onChange('inventoryLowStockThreshold', Number(e.target.value))} />
            </label>
            <label>
              <span>Día de pago nómina</span>
              <input className="input" type="number" min={1} max={31} value={settings.payrollPayday} onChange={e => onChange('payrollPayday', Number(e.target.value))} />
            </label>
            <label>
              <span>PIN administrador (opcional)</span>
              <input className="input" type="password" value={settings.adminPIN} onChange={e => onChange('adminPIN', e.target.value)} placeholder="••••" />
            </label>
          </div>
          <div className="row">
            <label className="switch">
              <input type="checkbox" checked={settings.tipsEnabled} onChange={e => onChange('tipsEnabled', e.target.checked)} />
              <span className="slider" />
              <span>Habilitar propinas</span>
            </label>
            <label className="switch">
              <input type="checkbox" checked={settings.backupsAuto} onChange={e => onChange('backupsAuto', e.target.checked)} />
              <span className="slider" />
              <span>Backups automáticos</span>
            </label>
          </div>
        </div>

        {/* Notificaciones y seguridad */}
        <div className="config-card">
          <div className="card-header"><HiShieldCheck /> Notificaciones y seguridad</div>
          <div className="row">
            <label className="switch">
              <input type="checkbox" checked={settings.notifyEmail} onChange={e => onChange('notifyEmail', e.target.checked)} />
              <span className="slider" />
              <span>Notificar por email</span>
            </label>
            <label className="switch">
              <input type="checkbox" checked={settings.notifyDesktop} onChange={e => onChange('notifyDesktop', e.target.checked)} />
              <span className="slider" />
              <span>Notificar en escritorio</span>
            </label>
          </div>
          <div className="row actions">
            <button className="btn" onClick={logoutAll}>Cerrar sesiones</button>
            <button className="btn danger" onClick={clearData}>Limpiar datos</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Configuracion;
