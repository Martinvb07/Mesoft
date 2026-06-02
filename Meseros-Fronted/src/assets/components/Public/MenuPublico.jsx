import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './MenuPublico.css';

const formatCOP = (value) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

const API_PUB = 'https://mesoft.store/api/public';

function StarRating({ value, max = 5, onSelect }) {
    return (
        <div style={{ display: 'inline-flex', gap: 2 }}>
            {Array.from({ length: max }, (_, i) => i + 1).map(star => (
                <span
                    key={star}
                    onClick={() => onSelect && onSelect(star)}
                    style={{
                        cursor: onSelect ? 'pointer' : 'default',
                        fontSize: onSelect ? '1.4rem' : '1rem',
                        color: star <= value ? '#f59e0b' : '#d1d5db',
                        lineHeight: 1,
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
}

function ReviewSection({ restaurantId, productoId }) {
    const [reviewData, setReviewData] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formStars, setFormStars] = useState(0);
    const [formComment, setFormComment] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        fetch(`${API_PUB}/${restaurantId}/reviews?producto_id=${productoId}`)
            .then(r => r.json())
            .then(d => setReviewData(d))
            .catch(() => {});
    }, [restaurantId, productoId]);

    const handleSubmit = async () => {
        if (!formStars) return;
        setEnviando(true);
        try {
            await fetch(`${API_PUB}/${restaurantId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producto_id: productoId, estrellas: formStars, comentario: formComment }),
            });
            setSent(true);
            setShowForm(false);
            // Actualizar promedio localmente
            const prev = reviewData || { total: 0, promedio: 0, reviews: [] };
            const newTotal = prev.total + 1;
            const newProm = Math.round(((prev.promedio * prev.total) + formStars) / newTotal * 10) / 10;
            setReviewData({ ...prev, total: newTotal, promedio: newProm });
        } catch {}
        setEnviando(false);
    };

    const promedio = reviewData?.promedio || 0;
    const total = reviewData?.total || 0;

    return (
        <div style={{ marginTop: '.5rem' }}>
            {total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.3rem' }}>
                    <StarRating value={Math.round(promedio)} />
                    <span style={{ fontSize: '.8rem', color: '#6b7280' }}>{promedio} ({total})</span>
                </div>
            )}
            {sent ? (
                <div style={{ fontSize: '.82rem', color: '#16a34a', fontWeight: 600 }}>¡Gracias por tu opinión!</div>
            ) : showForm ? (
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '.6rem', marginTop: '.3rem' }}>
                    <div style={{ marginBottom: '.4rem' }}>
                        <StarRating value={formStars} onSelect={setFormStars} />
                    </div>
                    <textarea
                        placeholder="Comentario opcional..."
                        value={formComment}
                        onChange={e => setFormComment(e.target.value)}
                        rows={2}
                        style={{ width: '100%', borderRadius: 6, border: '1px solid #d1d5db', padding: '.35rem .5rem', fontSize: '.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '.4rem', marginTop: '.35rem' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={!formStars || enviando}
                            style={{ padding: '.3rem .7rem', background: '#ff6633', color: '#fff', border: 'none', borderRadius: 6, cursor: formStars ? 'pointer' : 'not-allowed', fontSize: '.85rem', fontWeight: 600 }}
                        >
                            {enviando ? 'Enviando…' : 'Enviar'}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{ padding: '.3rem .7rem', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '.85rem' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    style={{ fontSize: '.8rem', color: '#ff6633', background: 'transparent', border: '1px solid #ff6633', borderRadius: 6, padding: '.2rem .55rem', cursor: 'pointer', marginTop: '.2rem' }}
                >
                    Calificar
                </button>
            )}
        </div>
    );
}

function MenuPublico() {
    const { restaurantId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!restaurantId) return;
        setLoading(true);
        fetch(`${API_PUB}/${restaurantId}/menu`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((json) => { setData(json); setLoading(false); })
            .catch((e) => { setError(e.message || 'No se pudo cargar el menú'); setLoading(false); });
    }, [restaurantId]);

    if (loading) {
        return (
            <div className="menu-pub-page">
                <div className="menu-pub-loading">Cargando menú...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="menu-pub-page">
                <div className="menu-pub-error">
                    <span className="menu-pub-error-icon">!</span>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const restaurante = data?.restaurante;
    const categorias = Array.isArray(data?.categorias) ? data.categorias : [];

    return (
        <div className="menu-pub-page">
            <header className="menu-pub-header">
                <h1 className="menu-pub-title">{restaurante?.nombre || 'Menú'}</h1>
                <p className="menu-pub-subtitle">Consulta nuestros productos y precios</p>
            </header>

            {categorias.length === 0 ? (
                <div className="menu-pub-empty">No hay productos disponibles por ahora.</div>
            ) : (
                <div className="menu-pub-content">
                    {categorias.map((cat, idx) => (
                        <section key={idx} className="menu-pub-category">
                            <h2 className="menu-pub-cat-title">{cat.nombre}</h2>
                            <div className="menu-pub-products">
                                {(Array.isArray(cat.productos) ? cat.productos : []).map((prod) => (
                                    <div key={prod.id} className="menu-pub-card">
                                        {prod.imagen ? (
                                            <img
                                                src={prod.imagen}
                                                alt={prod.nombre}
                                                className="menu-pub-card-img"
                                                onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex'); }}
                                            />
                                        ) : (
                                            <div className="menu-pub-card-img-placeholder">🍽️</div>
                                        )}
                                        <div className="menu-pub-card-body">
                                            <div className="menu-pub-card-name">{prod.nombre}</div>
                                            {prod.descripcion && (
                                                <div className="menu-pub-card-desc">{prod.descripcion}</div>
                                            )}
                                            <ReviewSection restaurantId={restaurantId} productoId={prod.id} />
                                        </div>
                                        <div className="menu-pub-card-price">{formatCOP(prod.precio)}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <footer className="menu-pub-footer">
                <span>Powered by <strong>Mesoft</strong></span>
            </footer>
        </div>
    );
}

export default MenuPublico;
