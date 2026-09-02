import React, { useRef, useState } from 'react';
import { HiOutlineArrowUpTray, HiOutlineTrash, HiArrowPath } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import { api } from '../../../api/client';
import { imagenTransformada } from '../../../utils/imagen';
import '../../css/landing-tailwind.css';

/* Sube la imagen directo a Cloudinary con una firma que da el backend: el
   archivo no pasa por nuestro servidor. Sigue aceptando pegar una ruta local
   (/categorias/x.jpg) o una URL externa a mano. */

const MAX_MB = 10;

export default function ImagenUploader({ value, onChange, carpeta = 'categorias', className = '' }) {
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    const subir = async (file) => {
        if (!file) return;
        if (!file.type?.startsWith('image/')) return setError('Ese archivo no es una imagen.');
        if (file.size > MAX_MB * 1024 * 1024) return setError(`La imagen pesa más de ${MAX_MB} MB.`);
        setSubiendo(true);
        setError('');
        try {
            const firma = await api.firmaCloudinary(carpeta);
            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', firma.apiKey);
            fd.append('timestamp', firma.timestamp);
            fd.append('folder', firma.folder);
            fd.append('signature', firma.signature);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`, {
                method: 'POST',
                body: fd,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.secure_url) throw new Error(data?.error?.message || 'Cloudinary rechazó la imagen');
            onChange(data.secure_url);
        } catch (e) {
            setError(e?.message || 'No se pudo subir la imagen');
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <div className={className}>
            <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); subir(e.dataTransfer.files?.[0]); }}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
            >
                {value ? (
                    <img src={imagenTransformada(value, { w: 160, h: 160, modo: 'fit', recortarBorde: true })} alt="" style={{ backgroundColor: '#ffffff' }} className="h-16 w-16 shrink-0 rounded-lg object-contain ring-1 ring-slate-200" />
                ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white text-slate-300 ring-1 ring-slate-200">
                        <HiOutlineArrowUpTray className="h-5 w-5" />
                    </span>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={subiendo}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-slate-900 disabled:opacity-60"
                        >
                            {subiendo ? (
                                <>
                                    <motion.span className="flex" animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                                        <HiArrowPath className="h-3.5 w-3.5" />
                                    </motion.span>
                                    Subiendo…
                                </>
                            ) : (
                                <><HiOutlineArrowUpTray className="h-3.5 w-3.5" /> {value ? 'Cambiar' : 'Subir imagen'}</>
                            )}
                        </button>
                        {value && !subiendo && (
                            <button
                                type="button"
                                onClick={() => { onChange(''); setError(''); }}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-red-500"
                            >
                                <HiOutlineTrash className="h-3.5 w-3.5" /> Quitar
                            </button>
                        )}
                    </div>
                    <p className="m-0 mt-1.5 text-[11px] leading-tight text-slate-400">
                        Arrastra la foto aquí o súbela desde el celular. Se recorta y comprime sola.
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => { subir(e.target.files?.[0]); e.target.value = ''; }}
                />
            </div>

            {error && <p className="m-0 mt-1.5 text-[11px] font-semibold text-red-500">{error}</p>}

            <input
                className="mt-2 w-full rounded-xl border-0 bg-slate-50 px-3.5 py-2 text-xs text-slate-600 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-400"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder="…o pega una URL / ruta como /categorias/x.webp"
            />
        </div>
    );
}
