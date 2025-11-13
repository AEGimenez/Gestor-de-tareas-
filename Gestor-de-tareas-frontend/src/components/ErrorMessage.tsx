// Componente de Presentación para el Error
import React from 'react';
import { FriendlyError } from '../utils/http'; // Asegúrate de exportar FriendlyError

interface ErrorProps {
    error: Error | string | null;
    onRetry?: () => void;
}

const errorContainerStyle: React.CSSProperties = {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#FFF0F0', // Fondo rojo claro
    border: '1px solid #FFC0C0',
    borderRadius: '8px',
    margin: '2rem 0',
};

export const ErrorMessage: React.FC<ErrorProps> = ({ error, onRetry }) => {
    if (!error) return null;

    const message = error instanceof Error ? error.message : String(error);
    let icon = '❌'; // Ícono por defecto (para errores de validación, etc.)
    let title = 'Error al cargar datos';

    // ⭐️ Lógica para identificar el error de Conexión
    if (error instanceof FriendlyError && message.includes("Error de Conexión")) {
        icon = '⚠️'; 
        title = '¡Sin Conexión!';
    } else if (error instanceof Error) {
        // Podrías poner aquí otra lógica para 404, 400, etc.
        title = 'Error en la aplicación';
    }

    return (
        <div style={errorContainerStyle}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>{icon}</p>
            <h3 style={{ margin: '0 0 0.5rem', color: '#CC0000' }}>{title}</h3>
            <p style={{ margin: '0 0 1rem' }}>{message}</p>
            
            {onRetry && (
                <button 
                    onClick={onRetry}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        backgroundColor: '#4285F4', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Reintentar
                </button>
            )}
        </div>
    );
};