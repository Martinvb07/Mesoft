import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './MenuPublico.css';

const formatCOP = (value) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

function MenuPublico() {
    const { restaurantId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!restaurantId) return;
        setLoading(true);
        fetch(`https://mesoft.store/api/public/${restaurantId}/menu`)
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
                                        <div className="menu-pub-card-body">
                                            <div className="menu-pub-card-name">{prod.nombre}</div>
                                            {prod.descripcion && (
                                                <div className="menu-pub-card-desc">{prod.descripcion}</div>
                                            )}
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
