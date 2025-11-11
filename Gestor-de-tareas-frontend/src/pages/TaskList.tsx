// src/pages/TaskList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { http } from '../utils/http';
import { type Task, TaskStatus, TaskPriority } from '../types/task';
import { getFullName } from '../types/user';

// --- (Componentes de helper StatusBadge, PriorityBadge, formatDate) ---
function formatDate(dateString?: string) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}
function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: React.CSSProperties = { padding: '2px 8px', borderRadius: '12px', fontSize: '0.875rem', color: 'black' };
  switch (status) {
    case TaskStatus.PENDING:
      return <span style={{ ...styles, backgroundColor: '#FEE2E2' }}>🔴 Pendiente</span>;
    case TaskStatus.IN_PROGRESS:
      return <span style={{ ...styles, backgroundColor: '#FEF3C7' }}>🟡 En curso</span>;
    case TaskStatus.COMPLETED:
      return <span style={{ ...styles, backgroundColor: '#D1FAE5' }}>✅ Finalizada</span>;
    case TaskStatus.CANCELLED:
      return <span style={{ ...styles, backgroundColor: '#E5E7EB' }}>⚫ Cancelada</span>;
    default:
      return <span style={{ ...styles, backgroundColor: '#E5E7EB' }}>{status}</span>;
  }
}
function PriorityBadge({ priority }: { priority: TaskPriority }) {
   switch (priority) {
    case TaskPriority.HIGH: return <span>🔴 Alta</span>;
    case TaskPriority.MEDIUM: return <span>🟡 Media</span>;
    case TaskPriority.LOW: return <span>🟢 Baja</span>;
    default: return <span>{priority}</span>;
  }
}
// --- (Fin de los componentes de helper) ---

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await http.get<Task[]>("/tasks");
        setTasks(response); 
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la lista de tareas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, []);

  if (isLoading) return <div style={{ padding: '2rem' }}>⏳ Cargando tareas...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Tareas</h2>
        <button 
          onClick={() => navigate('/tasks/new')} 
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            color: 'white',
            backgroundColor: '#3B82F6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          + Nueva Tarea
        </button>
      </div>

      {/* --- ✅ LÍNEA CORREGIDA --- */}
      {/* (Restauramos el JSX del estado vacío) */}
      {!isLoading && !error && tasks.length === 0 && (
         <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <span style={{ fontSize: '2rem' }}>📋</span>
          <h3>No hay tareas creadas</h3>
          <p>¡Crea tu primera tarea para comenzar!</p>
        </div>
      )}
      {/* --- Fin de la corrección --- */}

      {tasks.length > 0 && (
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead style={{ backgroundColor: '#F3F4F6' }}>
             <tr>
              <th style={tableHeaderStyle}>#</th>
              <th style={tableHeaderStyle}>Título</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Estado</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Prioridad</th>
              <th style={tableHeaderStyle}>Vence</th>
              <th style={tableHeaderStyle}>Asignado</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr 
                key={task.id} 
                style={{ 
                  borderBottom: '1px solid #E5E7EB',
                  cursor: 'pointer' 
                }}
                onClick={() => navigate(`/tasks/${task.id}`)} 
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} 
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <td style={tableCellStyle}>{task.id}</td>
                <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{task.title}</td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                  <StatusBadge status={task.status} />
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td style={tableCellStyle}>{formatDate(task.dueDate)}</td>
                <td style={tableCellStyle}>
                  {task.assignedTo ? getFullName(task.assignedTo) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// (Los estilos de la tabla siguen igual)
const tableHeaderStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' };
const tableCellStyle: React.CSSProperties = { padding: '0.75rem 1rem', verticalAlign: 'middle' };