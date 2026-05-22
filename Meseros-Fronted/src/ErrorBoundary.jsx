import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif',
                    gap: '1rem', padding: '2rem', textAlign: 'center'
                }}>
                    <h2>Algo salió mal</h2>
                    <p style={{ color: '#666', maxWidth: '400px' }}>
                        Si tienes extensiones del navegador activas (como Google Translate, Grammarly, etc.),
                        intenta abrir en modo incógnito o desactívalas.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.5rem 1.5rem', background: '#e85d04', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem'
                        }}
                    >
                        Recargar página
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
