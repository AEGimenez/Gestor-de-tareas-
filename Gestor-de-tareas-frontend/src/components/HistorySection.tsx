// src/components/HistorySection.tsx
import { useState, useEffect } from 'react';
import { http } from '../utils/http';
import { type StatusHistory } from '../types/history';
// import { TaskStatus } from '../types/task'; // (No lo usamos en este componente, se puede quitar)
import { getFullName } from '../types/user';

// --- ✅ FUNCIÓN DE FECHA CORREGIDA ---
// (Reemplazamos la versión anterior por esta)
function formatRelativeDate(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    // Asumimos que la fecha siempre es en el pasado (no usamos Math.abs)
    const diffTime = now.getTime() - date.getTime(); 

    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return `hace ${diffDays} días`;
    }
    if (diffDays === 1) {
      return "ayer";
    }
    if (diffHours >= 1) {
      return `hace ${diffHours} h`;
    }
    if (diffMinutes >= 1) {
      return `hace ${diffMinutes} min`;
    }
    // Si es menos de 1 minuto
    return "hace unos segundos";

  } catch (error) {
    return "fecha inválida";
  }
}
// --- FIN DE LA CORRECCIÓN ---


// Componente para un solo item del historial
function HistoryItem({ item }: { item: StatusHistory }) {
  
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

  const prev = capitalize(item.previousStatus);
  const next = capitalize(item.newStatus);
  const user = getFullName(item.changedBy);
  const time = formatRelativeDate(item.changedAt); // <-- Ahora usará la nueva función

  return (
    <div style={{ padding: '0.5rem 0.25rem', borderBottom: '1px solid #E5E7EB' }}>
      <p style={{ color: '#374151' }}>
        <strong>@{user}</strong> cambió el estado: 
        <span style={{ fontWeight: 'bold', color: '#EF4444' }}> {prev}</span> → 
        <span style={{ fontWeight: 'bold', color: '#10B981' }}> {next}</span>
      </p>
      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
        ({time})
      </p>
    </div>
  );
}

// (El resto del componente HistorySection sigue igual)
export function HistorySection({ taskId }: { taskId: number }) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await http.get<{ data: StatusHistory[] }>(
          `/history/task/${taskId}`
        );
        setHistory(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el historial.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [taskId]);

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '8px', border: '1px solid #E5E7EB', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>📜 Historial de Cambios</h3>
      
      <div style={{ marginTop: '1rem' }}>
        {isLoading && <p>Cargando historial...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {!isLoading && history.length === 0 && (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '1rem' }}>
              No hay cambios de estado registrados.
            </p>
          )}
          {history.map(item => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}