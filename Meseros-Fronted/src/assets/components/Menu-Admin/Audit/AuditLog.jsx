import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../../api/client';

// Keys: the original AuditLog key AND the new utils/audit.js key
const AUDIT_KEY = 'mesoft_audit_logs_v1';
const AUDIT_KEY_V2 = 'mesoft_audit_v1';
const MAX_LOGS = 200;

// Client-side audit logger (exported for other modules to use)
export function logAuditEvent(action, detail = '') {
    try {
        let user = 'Desconocido';
        const keys = ['currentUser', 'usuario', 'user', 'auth_user'];
        for (const k of keys) {
            const raw = localStorage.getItem(k);
            if (raw) { const u = JSON.parse(raw); user = u?.nombre || u?.usuario || u?.correo || user; break; }
        }
        const logs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
        const entry = { id: Date.now(), timestamp: new Date().toISOString(), user, action, detail };
        const updated = [entry, ...logs].slice(0, MAX_LOGS);
        localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
    } catch {}
}

function AuditLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        // Try backend first (TODO: endpoint /audit/logs), fallback to localStorage
        let backendLogs = [];
        try {
            const resp = await api.getAuditLogs();
            backendLogs = Array.isArray(resp) ? resp : (Array.isArray(resp?.logs) ? resp.logs : []);
        } catch {
            // expected while endpoint doesn't exist
        }

        const localLogs = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
        const localLogsV2 = JSON.parse(localStorage.getItem(AUDIT_KEY_V2) || '[]');

        // Merge, deduplicate by id/timestamp, sort descending
        const all = [...backendLogs, ...localLogs, ...localLogsV2];
        const seen = new Set();
        const merged = all
            .filter(l => { const k = l.id || l.timestamp; if (seen.has(k)) return false; seen.add(k); return true; })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50);
        setLogs(merged);
        setLoading(false);
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const limpiar = () => {
        if (!window.confirm('¿Limpiar logs locales?')) return;
        localStorage.removeItem(AUDIT_KEY);
        localStorage.removeItem(AUDIT_KEY_V2);
        cargar();
    };

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Auditoría</h1>
                    <p style={{ margin: '.25rem 0 0', color: '#6b7280' }}>Últimas 50 acciones del sistema</p>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn" onClick={cargar} disabled={loading}>Refrescar</button>
                    <button className="btn danger" onClick={limpiar}>Limpiar locales</button>
                </div>
            </div>

            {loading && <div style={{ color: '#6b7280', padding: '1rem' }}>Cargando…</div>}

            {!loading && logs.length === 0 && (
                <div style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    No hay registros de auditoría aún.
                </div>
            )}

            {!loading && logs.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #eef2f6', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 18px rgba(44,62,80,0.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '.6rem .8rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Fecha</th>
                                <th style={{ padding: '.6rem .8rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Usuario</th>
                                <th style={{ padding: '.6rem .8rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Acción</th>
                                <th style={{ padding: '.6rem .8rem', textAlign: 'left', fontSize: '.85rem', fontWeight: 700, color: '#374151', borderBottom: '1px solid #eef2f6' }}>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, idx) => {
                                const fecha = log.timestamp
                                    ? new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(log.timestamp))
                                    : '—';
                                return (
                                    <tr key={log.id || idx} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '.5rem .8rem', fontSize: '.85rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{fecha}</td>
                                        <td style={{ padding: '.5rem .8rem', fontSize: '.875rem', fontWeight: 600, color: '#1f2937' }}>{log.user || log.usuario || '—'}</td>
                                        <td style={{ padding: '.5rem .8rem', fontSize: '.875rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '.15rem .5rem', borderRadius: 999, fontSize: '.8rem', fontWeight: 700, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                                                {log.action || log.accion || '—'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '.5rem .8rem', fontSize: '.875rem', color: '#374151', maxWidth: 320 }}>
                                            <span title={log.detail || log.detalle || ''}>{log.detail || log.detalle || '—'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AuditLog;
