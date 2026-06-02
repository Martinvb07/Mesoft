/**
 * audit.js — Client-side audit logging utility
 * Stores actions in localStorage mesoft_audit_v1 (max 200 entries).
 */

const AUDIT_KEY = 'mesoft_audit_v1';
const MAX_ENTRIES = 200;

function getCurrentUser() {
    const keys = ['currentUser', 'usuario', 'user', 'auth_user'];
    for (const k of keys) {
        try {
            const raw = localStorage.getItem(k);
            if (raw) {
                const u = JSON.parse(raw);
                return u?.nombre || u?.usuario || u?.correo || u?.name || 'Desconocido';
            }
        } catch {}
    }
    return 'Desconocido';
}

/**
 * Log an audit action.
 * @param {string} user   - Optional override; if null reads from localStorage
 * @param {string} action - Short action label e.g. 'login', 'crear_producto'
 * @param {string} detail - Detail string (product name, table number, etc.)
 */
export function logAudit(user, action, detail = '') {
    try {
        const resolvedUser = user || getCurrentUser();
        const existing = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            user: resolvedUser,
            action,
            detail: String(detail),
        };
        const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
        localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
    } catch {
        // silently fail — audit must never crash the app
    }
}

/**
 * Read all audit entries (newest first).
 */
export function getAuditLogs() {
    try {
        const raw = localStorage.getItem(AUDIT_KEY) || '[]';
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Clear all local audit entries.
 */
export function clearAuditLogs() {
    try {
        localStorage.removeItem(AUDIT_KEY);
    } catch {}
}

export default { logAudit, getAuditLogs, clearAuditLogs };
