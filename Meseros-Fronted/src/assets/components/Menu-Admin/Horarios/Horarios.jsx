import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { api } from '../../../../api/client';

const LS_KEY = 'mesoft_horarios_v1';
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function loadHorarios() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch { return {}; }
}

function saveHorarios(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// horarios: { [meseroId_dia]: { turno: '8:00-16:00' | 'Libre' } }

const Horarios = () => {
    const [meseros, setMeseros] = useState([]);
    const [horarios, setHorarios] = useState({});
    const [editCell, setEditCell] = useState(null); // { meseroId, dia }
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        api.getMeseros().catch(() => []).then(res => setMeseros(Array.isArray(res) ? res : []));
        setHorarios(loadHorarios());
    }, []);

    const key = (meseroId, dia) => `${meseroId}__${dia}`;

    const getTurno = (meseroId, dia) => horarios[key(meseroId, dia)]?.turno || '';

    const setTurno = (meseroId, dia, turno) => {
        setHorarios(prev => {
            const next = { ...prev, [key(meseroId, dia)]: { turno } };
            saveHorarios(next);
            return next;
        });
    };

    const openEdit = (meseroId, dia) => {
        setEditCell({ meseroId, dia });
        setEditValue(getTurno(meseroId, dia) || '');
    };

    const applyEdit = () => {
        if (!editCell) return;
        setTurno(editCell.meseroId, editCell.dia, editValue);
        setEditCell(null);
    };

    const printHorario = () => {
        const w = window.open('', 'PRINT', 'width=900,height=700');
        if (!w) return;
        let html = `<!doctype html><html><head><title>Horarios</title>
<style>body{font-family:sans-serif;margin:24px;} table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ccc;padding:8px;text-align:center;font-size:12px;} th{background:#f3f4f6;} .working{background:#dcfce7;color:#166534;font-weight:600;} .libre{background:#f3f4f6;color:#9ca3af;}</style>
</head><body><h2>Horario Semanal</h2><table>
<thead><tr><th>Mesero</th>${DIAS.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;
        for (const m of meseros) {
            html += `<tr><td style="text-align:left;font-weight:600">${m.nombre}</td>`;
            for (const dia of DIAS) {
                const turno = getTurno(m.id, dia);
                if (!turno || turno === 'Libre') {
                    html += `<td class="libre">Libre</td>`;
                } else {
                    html += `<td class="working">${turno}</td>`;
                }
            }
            html += '</tr>';
        }
        html += '</tbody></table></body></html>';
        w.document.write(html);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    return (
        <div className="fin-page">
            <div className="fin-header">
                <div>
                    <h1>Horarios semanales</h1>
                    <p className="muted">Asigna turnos a tus meseros. Guardado automáticamente en el navegador.</p>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn" onClick={printHorario}>Imprimir / exportar</button>
                </div>
            </div>

            <div className="fin-card" style={{ overflowX: 'auto' }}>
                {meseros.length === 0 ? (
                    <div className="empty">No hay meseros registrados.</div>
                ) : (
                    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '.6rem 1rem', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 700, minWidth: 140 }}>
                                    Mesero
                                </th>
                                {DIAS.map(dia => (
                                    <th key={dia} style={{ padding: '.6rem .5rem', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600, fontSize: '.875rem', minWidth: 100 }}>
                                        {dia}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {meseros.map(m => (
                                <tr key={m.id}>
                                    <td style={{ padding: '.5rem 1rem', border: '1px solid #e5e7eb', fontWeight: 600, background: '#fafafa' }}>
                                        {m.nombre}
                                    </td>
                                    {DIAS.map(dia => {
                                        const turno = getTurno(m.id, dia);
                                        const isEditing = editCell?.meseroId === m.id && editCell?.dia === dia;
                                        const isLibre = !turno || turno === 'Libre';
                                        return (
                                            <td key={dia} style={{ padding: '.35rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                                                {isEditing ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', alignItems: 'center' }}>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            placeholder="8:00-16:00 o Libre"
                                                            style={{ width: '100%', padding: '.25rem .35rem', borderRadius: 4, border: '1px solid #d1d5db', fontSize: '.82rem', textAlign: 'center' }}
                                                            onKeyDown={e => { if (e.key === 'Enter') applyEdit(); if (e.key === 'Escape') setEditCell(null); }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '.2rem' }}>
                                                            <button
                                                                type="button"
                                                                onClick={applyEdit}
                                                                style={{ padding: '.15rem .45rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '.78rem' }}
                                                            >
                                                                OK
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setTurno(m.id, dia, 'Libre'); setEditCell(null); }}
                                                                style={{ padding: '.15rem .45rem', background: '#9ca3af', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '.78rem' }}
                                                            >
                                                                Libre
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => openEdit(m.id, dia)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            padding: '.3rem .45rem',
                                                            borderRadius: 8,
                                                            fontSize: '.82rem',
                                                            fontWeight: isLibre ? 400 : 700,
                                                            background: isLibre ? '#f3f4f6' : '#dcfce7',
                                                            color: isLibre ? '#9ca3af' : '#166534',
                                                            minHeight: 32,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                        title="Clic para editar turno"
                                                    >
                                                        {isLibre ? 'Libre' : turno}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div style={{ marginTop: '.75rem', fontSize: '.82rem', color: '#9ca3af' }}>
                    Clic en cualquier celda para asignar o modificar el turno. Escribe el horario (ej: <strong>8:00-16:00</strong>) o deja <strong>Libre</strong>.
                </div>
            </div>
        </div>
    );
};

export default Horarios;
