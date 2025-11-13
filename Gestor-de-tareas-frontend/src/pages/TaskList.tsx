// src/pages/TaskList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { http } from '../utils/http';
import { type Task, TaskStatus, TaskPriority } from '../types/task';
import { type Tag } from '../types/tag'; // Importar Tag
import { getFullName } from '../types/user';
import { useDebounce } from '@uidotdev/usehooks';
import { useUser } from '../context/UserContext';

// (Los componentes StatusBadge, PriorityBadge y formatDate siguen igual)
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


export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); 
  const { memberships } = useUser(); 

  // --- Estados para todos los filtros ---
  const [statusFilter, setStatusFilter] = useState<string>(""); 
  const [priorityFilter, setPriorityFilter] = useState<string>(""); 
  const [teamFilter, setTeamFilter] = useState<string>(""); 
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dueDateFrom, setDueDateFrom] = useState<string>("");
  const [dueDateTo, setDueDateTo] = useState<string>("");     
  
  // --- 1. ESTADO DE TAGS CORREGIDO (string, no array) ---
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagFilter, setTagFilter] = useState<string>(""); // "" significa "Todas"
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // useEffect para cargar TODAS las etiquetas (sigue igual)
  useEffect(() => {
    http.get<{ data: Tag[] }>('/tags')
      .then(response => setAllTags(response.data))
      .catch(err => console.error("Error al cargar etiquetas:", err));
  }, []); 

  // --- 2. useEffect ACTUALIZADO CON FILTRO DE TAGS (string) ---
  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (teamFilter) params.append('teamId', teamFilter);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (dueDateFrom) params.append('dueDateFrom', dueDateFrom);
      if (dueDateTo) params.append('dueDateTo', dueDateTo);
      
      // Si hay un tagFilter, lo añadimos (el backend ya sabe manejar 1 o N tags)
      if (tagFilter) {
        params.append('tags', tagFilter);
      }
      
      const queryString = params.toString();

      try {
        const response = await http.get<Task[]>(`/tasks?${queryString}`);
        setTasks(response); 
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la lista de tareas.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchTasks();
  }, [statusFilter, priorityFilter, teamFilter, debouncedSearchTerm, dueDateFrom, dueDateTo, tagFilter]); // <-- Dependencia es 'tagFilter'

  
  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  }

  // --- 3. FUNCIÓN PARA LIMPIAR FILTROS (ACTUALIZADA) ---
  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setTeamFilter("");
    setSearchTerm("");
    setDueDateFrom("");
    setDueDateTo("");
    setTagFilter(""); // <-- Limpiar tag
  };

  // (Ya no necesitamos handleTagFilterChange para el select simple)

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Tareas</h2>
        <button 
          onClick={() => navigate('/tasks/new')} 
          style={buttonStyle}
        >
          + Nueva Tarea
        </button>
      </div>

      {/* --- 4. BARRA DE FILTROS ACTUALIZADA (CON TAGS SIMPLES) --- */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1rem', 
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        marginBottom: '1rem'
      }}>
        {/* Fila 1: Equipo y Búsqueda */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {/* (Select de Equipo) */}
          <select 
            style={filterSelectStyle}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">Equipo (Todos)</option>
            {memberships.filter(m => m.team).map(m => (
              <option key={m.team!.id} value={m.team!.id}>{m.team!.name}</option>
            ))}
          </select>
          
          {/* (Input de Búsqueda) */}
          <input 
            type="text" 
            placeholder="🔍 Buscar por título o descripción..." 
            style={{ ...filterSelectStyle, flex: 1 }} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Fila 2: Atributos (Status, Prioridad, Fechas, Tags) */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          {/* (Select de Estado) */}
          <select 
            style={filterSelectStyle}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Estado (Todos)</option>
            {Object.values(TaskStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* (Select de Prioridad) */}
          <select 
            style={filterSelectStyle}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">Prioridad (Todas)</option>
            {Object.values(TaskPriority).map(prio => (
              <option key={prio} value={prio}>{prio}</option>
            ))}
          </select>
          
          {/* (Inputs de Fecha) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={dateLabelStyle}>Vence (Desde):</label>
            <input 
              type="date" 
              style={filterSelectStyle} 
              value={dueDateFrom}
              onChange={(e) => setDueDateFrom(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={dateLabelStyle}>Vence (Hasta):</label>
            <input 
              type="date" 
              style={filterSelectStyle} 
              value={dueDateTo}
              onChange={(e) => setDueDateTo(e.target.value)}
            />
          </div>

          {/* --- SELECTOR DE TAGS CORREGIDO --- */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={dateLabelStyle}>Etiqueta:</label>
            <select 
              style={filterSelectStyle}
              value={tagFilter} // Conectado al estado (string)
              onChange={(e) => setTagFilter(e.target.value)} // OnChange simple
            >
              <option value="">Etiqueta (Todas)</option>
              {allTags.map(tag => (
                <option key={tag.id} value={tag.id.toString()}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          {/* --- FIN DE LA CORRECCIÓN --- */}

          {/* Botón de Limpiar */}
          <button 
            onClick={clearFilters}
            style={{ ...filterSelectStyle, backgroundColor: '#F3F4F6', cursor: 'pointer', marginLeft: 'auto' }}
          >
            Limpiar Filtros
          </button>
        </div>
      </div>


      {/* (Estado de Carga) */}
      {isLoading && <p>⏳ Cargando tareas...</p>}

      {/* --- 9. ESTADO VACÍO (ACTUALIZADO) --- */}
      {!isLoading && !error && tasks.length === 0 && (
         <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <span style={{ fontSize: '2rem' }}>📋</span>
          <h3>
            {statusFilter || priorityFilter || searchTerm || teamFilter || dueDateFrom || dueDateTo || tagFilter
              ? "No hay tareas que coincidan con los filtros" 
              : "No hay tareas creadas"}
          </h3>
          <p>Prueba cambiar los filtros o crea una nueva tarea.</p>
        </div>
      )}

      {/* (Tabla de Tareas - Sigue igual) */}
      {!isLoading && tasks.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
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
                style={{ borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}
                onClick={() => navigate(`/tasks/${task.id}`)} 
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'} 
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <td style={tableCellStyle}>{task.id}</td>
                <td style={{ ...tableCellStyle, fontWeight: 'bold' }}>{task.title}</td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}> <StatusBadge status={task.status} /> </td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}> <PriorityBadge priority={task.priority} /> </td>
                <td style={tableCellStyle}>{formatDate(task.dueDate)}</td>
                <td style={{ ...tableCellStyle }}>
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

// (Estilos)
const tableHeaderStyle: React.CSSProperties = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' };
const tableCellStyle: React.CSSProperties = { padding: '0.75rem 1rem', verticalAlign: 'middle' };
const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  color: 'white',
  backgroundColor: '#3B82F6',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};
const filterSelectStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #D1D5DB',
  backgroundColor: 'white',
  fontSize: '0.875rem' 
};
const dateLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6B7280',
  marginBottom: '2px',
  paddingLeft: '4px'
};