import React, { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { HiCog6Tooth, HiCloudArrowDown, HiCloudArrowUp, HiArrowPath, HiShieldCheck, HiPaintBrush, HiBuildingStorefront, HiCreditCard, HiDocumentText } from 'react-icons/hi2';
import '../../../css/Navbar/Menu-Admin/Configuracion/Configuracion.css';
import { api } from '../../../../api/client';

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

    // Integraciones de pago y DIAN
    const [integ, setInteg] = useState({
        wompi_public_key: '',
        bold_api_key: '',
        alegra_email: '',
        alegra_api_key: '',
        alegra_configurado: false,
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

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupPreview, setBackupPreview] = useState(null);
  const importJsonRef = useRef(null);

  const exportBackup = async () => {
      setBackupLoading(true);
      try {
          // Fetch backend data in parallel (with fallback to localStorage)
          const [productosRes, meserosRes, mesasRes, facturasRes] = await Promise.allSettled([
              api.getProductos(),
              api.getMeseros(),
              api.getMesas(),
              api.facturas({ limit: 500 }),
          ]);
          const productos = productosRes.status === 'fulfilled'
              ? (Array.isArray(productosRes.value?.items) ? productosRes.value.items : Array.isArray(productosRes.value) ? productosRes.value : safeParse('inventario_productos_v1', []))
              : safeParse('inventario_productos_v1', []);
          const meseros = meserosRes.status === 'fulfilled' ? (Array.isArray(meserosRes.value) ? meserosRes.value : safeParse('usuarios', [])) : safeParse('usuarios', []);
          const mesas = mesasRes.status === 'fulfilled' ? (Array.isArray(mesasRes.value) ? mesasRes.value : safeParse('mesas_data_v1', [])) : safeParse('mesas_data_v1', []);
          const facturas = facturasRes.status === 'fulfilled' ? (Array.isArray(facturasRes.value) ? facturasRes.value : []) : [];

          const backup = {
              version: 2,
              exportedAt: new Date().toISOString(),
              settings,
              data: {
                  productos,
                  meseros,
                  mesas,
                  facturas,
                  nominas: safeParse('fin_nominas_v1', []),
              }
          };
          const today = new Date().toISOString().slice(0,10);
          const filename = `mesoft-backup-${today}.json`;
          downloadJson(filename, backup);
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

  const importFullBackup = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      try {
          const text = await file.text();
          const json = JSON.parse(text);
          if (!json || typeof json !== 'object') {
              return Swal.fire('Archivo inválido', 'El archivo no es un backup válido de Mesoft.', 'error');
          }
          const { data } = json;
          // Show preview
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
      const confirm = await Swal.fire({
          title: 'Importar backup',
          text: `Se importarán: ${backupPreview.preview}. Esto sobrescribirá los datos locales.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, importar',
          cancelButtonText: 'Cancelar',
      });
      if (!confirm.isConfirmed) return;
      // Apply settings
      if (json.settings) {
          const merged = { ...defaultSettings, ...json.settings };
          saveSettingsToStorage(merged);
          setSettings(merged);
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
          <button className="btn" onClick={onImportClick}><HiCloudArrowUp /> Importar config</button>
          <button className="btn" onClick={onImportBackupClick} disabled={backupLoading}><HiCloudArrowUp /> Importar backup</button>
          <button className="btn" onClick={exportBackup} disabled={backupLoading}><HiCloudArrowDown /> {backupLoading ? 'Exportando…' : 'Exportar backup'}</button>
          <button className="btn primary" onClick={save}>Guardar cambios</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importBackup} />
          <input ref={importJsonRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importFullBackup} />
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
            <label>
              <span>PIN de apertura de turno (4 dígitos)</span>
              <input className="input" type="password" maxLength={4} value={settings.pinApertura} onChange={e => onChange('pinApertura', e.target.value.replace(/[^0-9]/g,'').slice(0,4))} placeholder="0000" />
            </label>
            <label>
              <span>Meta semanal ($)</span>
              <input className="input" type="number" min={0} value={settings.metaSemanal} onChange={e => onChange('metaSemanal', Number(e.target.value))} />
            </label>
            <label>
              <span>Meta mensual ($)</span>
              <input className="input" type="number" min={0} value={settings.metaMensual} onChange={e => onChange('metaMensual', Number(e.target.value))} />
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

        {/* Integraciones de pago */}
        <div className="config-card">
          <div className="card-header"><HiCreditCard /> Integraciones de pago</div>
          <div className="card-body form-grid">
            <label>
              <span>Wompi — Public Key</span>
              <input
                className="input"
                type="text"
                placeholder="pub_prod_..."
                value={integ.wompi_public_key}
                onChange={e => setInteg(prev => ({ ...prev, wompi_public_key: e.target.value }))}
              />
            </label>
            <label>
              <span>Bold — API Key</span>
              <input
                className="input"
                type="text"
                placeholder="bold_sk_..."
                value={integ.bold_api_key}
                onChange={e => setInteg(prev => ({ ...prev, bold_api_key: e.target.value }))}
              />
            </label>
          </div>
          <div className="muted small" style={{ padding: '0 1rem .5rem' }}>
            Los links de pago aparecerán automáticamente en la factura al cerrar una cuenta.
          </div>
          <div style={{ padding: '0 1rem 1rem' }}>
            <button className="btn primary" onClick={saveInteg} disabled={integLoading}>
              {integLoading ? 'Guardando…' : 'Guardar integraciones'}
            </button>
          </div>
        </div>

        {/* Facturación electrónica DIAN (Alegra) */}
        <div className="config-card">
          <div className="card-header"><HiDocumentText /> Facturación electrónica DIAN (Alegra)</div>
          <div className="card-body form-grid">
            <label>
              <span>Email de Alegra</span>
              <input
                className="input"
                type="email"
                placeholder="tucuenta@empresa.com"
                value={integ.alegra_email}
                onChange={e => setInteg(prev => ({ ...prev, alegra_email: e.target.value }))}
              />
            </label>
            <label>
              <span>API Key de Alegra</span>
              <input
                className="input"
                type="password"
                placeholder="••••••••••••••••"
                value={integ.alegra_api_key}
                onChange={e => setInteg(prev => ({ ...prev, alegra_api_key: e.target.value }))}
              />
            </label>
          </div>
          <div className="muted small" style={{ padding: '0 1rem' }}>
            Obtén tu API key en Alegra → Configuración → API → Generar token
          </div>
          <div style={{ padding: '.5rem 1rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
              padding: '.25rem .65rem', borderRadius: 20, fontSize: '.8rem', fontWeight: 600,
              background: integ.alegra_configurado ? '#dcfce7' : '#f3f4f6',
              color: integ.alegra_configurado ? '#16a34a' : '#6b7280',
            }}>
              {integ.alegra_configurado ? '✅ Configurado' : '⚪ Sin configurar'}
            </span>
            <button className="btn primary" onClick={saveInteg} disabled={integLoading}>
              {integLoading ? 'Guardando…' : 'Guardar'}
            </button>
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

      {/* Backup preview */}
      {backupPreview && (
          <div style={{ maxWidth: 720, margin: '1.5rem auto 0', background: '#fff', border: '1px solid #eef2f6', borderRadius: 16, padding: '1.25rem', boxShadow: '0 4px 18px rgba(44,62,80,.1)' }}>
              <h3 style={{ margin: '0 0 .5rem', fontSize: '1.1rem', fontWeight: 800 }}>Vista previa del backup</h3>
              <p style={{ margin: '0 0 .75rem', color: '#6b7280', fontSize: '.9rem' }}>Contenido detectado: <strong>{backupPreview.preview}</strong></p>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="btn primary" onClick={aplicarBackupPreview}>Aplicar backup</button>
                  <button className="btn ghost" onClick={() => setBackupPreview(null)}>Cancelar</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Configuracion;
