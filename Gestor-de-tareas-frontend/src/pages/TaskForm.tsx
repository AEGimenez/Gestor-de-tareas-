import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
// ⭐️ IMPORTAR FriendlyError desde utils/http
import { http, FriendlyError } from '../utils/http'; 
import { useUser } from '../context/UserContext';
import { TaskStatus, TaskPriority, type Task } from '../types/task';
import { type TeamMembership } from '../types/team'; 
import { getFullName, type User } from '../types/user'; 
import { CommentSection } from '../components/CommentSection';
import { HistorySection } from '../components/HistorySection';
import { TagSection } from '../components/TagSection';

// Supuesto: Tipo de dato de equipo
interface Team {
  id: number;
  name: string;
}

// (allowedTransitions sigue igual)
const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.CANCELLED]: [],
};

// ⭐️ INICIO DEL COMPONENTE DE MANEJO DE ERRORES ⭐️
interface ErrorProps {
    error: Error | string | null;
    onRetry?: () => void;
}

const errorContainerStyle: React.CSSProperties = {
    padding: '1.5rem',
    textAlign: 'center',
    backgroundColor: '#FFF0F0',
    border: '1px solid #FFC0C0',
    borderRadius: '6px',
    marginBottom: '1rem',
};

// Componente para mostrar errores con estilo amigable
const ErrorMessage: React.FC<ErrorProps> = ({ error, onRetry }) => {
    if (!error) return null;

    const message = error instanceof Error ? error.message : String(error);
    let icon = '❌'; 
    let title = 'Error de Proceso';

    // Lógica para identificar el error de Conexión (basado en el mensaje de http.ts)
    if (error instanceof FriendlyError && message.includes("Error de Conexión")) {
        icon = '⚠️'; 
        title = '¡Sin Conexión!';
    } else if (message.includes('HTTP Error') || message.includes('No se encontró')) {
        title = 'Error de la API';
    }

    return (
        <div style={errorContainerStyle}>
            <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>{icon}</p>
            <h3 style={{ margin: '0 0 0.5rem', color: '#CC0000' }}>{title}</h3>
            <p style={{ margin: '0 0 1rem', color: '#333' }}>{message}</p>
            
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
// ⭐️ FIN DEL COMPONENTE DE MANEJO DE ERRORES ⭐️


export function TaskForm() {
  const navigate = useNavigate();
  const { currentUser, memberships } = useUser(); 
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const taskIdAsNumber = Number(id);

  const [taskData, setTaskData] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(TaskStatus.PENDING);
  const [priority, setPriority] = useState(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // ⭐️ FUNCIÓN CENTRAL DE CARGA: Reutilizable para la carga inicial y para reintentar ⭐️
  const fetchTaskData = useCallback(async () => {
    if (isEditMode && id) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await http.get<Task>(`/tasks/${id}`);
        setTaskData(data); 
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
        setPriority(data.priority);
        setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "");
        setAssignedToId(data.assignedToId?.toString() || "");
        setTeamId(data.teamId.toString());
      } catch (err: any) {
        setError(err.message || "No se pudo cargar la tarea.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); 
    }
  }, [id, isEditMode]);

  // ⭐️ USO DEL FETCH TASK DATA:
  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  // (useEffect para setear team por defecto - Sigue igual)
  useEffect(() => {
    if (!isEditMode && memberships.length > 0 && memberships[0].team) {
      setTeamId(memberships[0].team.id.toString());
    }
  }, [isEditMode, memberships]);

  // (useEffect para cargar miembros del equipo - Sigue igual)
  useEffect(() => {
    if (!teamId) {
      setTeamMembers([]);
      setAssignedToId(""); 
      return;
    }
    async function fetchTeamMembers() {
      setIsMembersLoading(true);
      try {
        const response = await http.get<{ data: TeamMembership[] }>(
          `/memberships/team/${teamId}`
        );
        const members = response.data.map(m => m.user).filter(Boolean) as User[]; 
        setTeamMembers(members);
        if (assignedToId && !members.some(m => m.id === Number(assignedToId)) && !isLoading) {
          setAssignedToId("");
        }
      } catch (err: any) {
        // Dejamos el console.error, pero no actualizamos el estado general de error
        console.error("Error al cargar miembros del equipo:", err.message); 
        setTeamMembers([]);
      } finally {
        setIsMembersLoading(false);
      }
    }
    fetchTeamMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, isLoading]); 

  // (Lógica de Tarea Finalizada - Sigue igual)
  const isTaskFinalized = 
    taskData?.status === TaskStatus.COMPLETED || 
    taskData?.status === TaskStatus.CANCELLED;

  // --- LÓGICA DE handleSubmit CORREGIDA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !currentUser) return;
    if (!title.trim()) { setError("El título es obligatorio."); return; }
    if (!teamId) { setError("Debes seleccionar un equipo."); return; }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload = {
        title, description, status, priority,
        dueDate: dueDate || null,
        assignedToId: assignedToId ? Number(assignedToId) : null,
        teamId: Number(teamId),
        [isEditMode ? 'changedById' : 'createdById']: currentUser.id // Usamos una key dinámica
      };
      
      if (isEditMode) {
        await http.patch(`/tasks/${id}`, payload);
      } else {
        await http.post('/tasks', payload);
      }

      alert(`¡Tarea ${isEditMode ? 'actualizada' : 'creada'} exitosamente!`);
      navigate('/tasks');
      
    } catch (err: any) {
      // ⭐️ Capturamos el error amigable lanzado por http.ts
      setError(err.message || "Error desconocido al guardar la tarea.");
      // No usamos alert, ya que el componente ErrorMessage lo mostrará
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ⭐️ Renderizado Condicional del Formulario ⭐️
  if (isLoading) return <div style={{ padding: '2rem' }}>Cargando tarea...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/tasks" style={{ textDecoration: 'none', color: '#3B82F6' }}>
        &larr; Volver a Tareas
      </Link>
      
      <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '1rem 0' }}>
        {isEditMode ? `Editar Tarea #${id}` : 'Crear Nueva Tarea'}
      </h2>

      {isTaskFinalized && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '6px', marginBottom: '1rem' }}>
          ⚠️ Esta tarea está finalizada o cancelada. Solo se pueden editar comentarios y etiquetas.
        </div>
      )}
      
      {/* ⭐️ Renderiza el componente de error con la opción de reintentar */}
      {error && isEditMode && (
          // Si estamos en modo edición, permitimos reintentar la carga inicial
          <ErrorMessage error={error} onRetry={fetchTaskData} />
      )}
      {error && !isEditMode && (
          // Si estamos en modo creación, solo mostramos el error sin reintento de carga
          <ErrorMessage error={error} />
      )}

      {/* --- FORMULARIO COMPLETO --- */}
      <form 
        onSubmit={handleSubmit} 
        style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}
      >
        {/* Título */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title" style={labelStyle}>Título *</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isTaskFinalized} style={inputStyle} />
        </div>
        
        {/* Descripción */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={labelStyle}>Descripción</label>
          <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isTaskFinalized} style={inputStyle} />
        </div>
        
        {/* Selector de Equipo */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="teamId" style={labelStyle}>Equipo *</label>
          <select 
            id="teamId" 
            value={teamId} 
            onChange={(e) => setTeamId(e.target.value)} 
            disabled={isTaskFinalized || (isLoading && !isEditMode)}
            style={inputStyle}
          >
            <option value="">Seleccionar un equipo...</option>
            {memberships
              .filter(m => m.team) 
              .map(m => (
                <option key={m.team!.id} value={m.team!.id}>
                  {m.team!.name}
                </option>
            ))}
          </select>
        </div>
        
        {/* Fila de Status y Prioridad */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="status" style={labelStyle}>Estado *</label>
            <select 
              id="status" 
              value={status} 
              onChange={(e) => setStatus(e.target.value as TaskStatus)} 
              disabled={isTaskFinalized} 
              style={inputStyle}
            >
              {isEditMode ? (
                <>
                  <option value={taskData?.status}>{taskData?.status}</option> 
                  {allowedTransitions[taskData?.status ?? TaskStatus.PENDING].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value={TaskStatus.PENDING}>Pendiente</option>
                  <option value={TaskStatus.IN_PROGRESS}>En curso</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="priority" style={labelStyle}>Prioridad *</label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} disabled={isTaskFinalized} style={inputStyle}>
              <option value={TaskPriority.LOW}>Baja</option>
              <option value={TaskPriority.MEDIUM}>Media</option>
              <option value={TaskPriority.HIGH}>Alta</option>
            </select>
          </div>
        </div>

        {/* Fila de Asignado y Vence */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="assignedToId" style={labelStyle}>Asignado a</label>
            <select 
              id="assignedToId" 
              value={assignedToId} 
              onChange={(e) => setAssignedToId(e.target.value)} 
              disabled={isTaskFinalized || !teamId || isMembersLoading} 
              style={inputStyle}
            >
              <option value="">
                {isMembersLoading ? "Cargando miembros..." : (teamId ? "Sin asignar" : "Selecciona un equipo primero")}
              </option>
              {teamMembers.map(user => (
                <option key={user.id} value={user.id}>
                  {getFullName(user)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" style={labelStyle}>Vence</label>
            <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isTaskFinalized} style={inputStyle} />
          </div>
        </div>
        {/* --- FIN DEL FORMULARIO --- */}

        {/* Botones de Acción y Error */}
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" onClick={() => navigate('/tasks')} style={{ padding: '0.5rem 1rem', backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer' }}>
            {isTaskFinalized ? "Cerrar" : "Cancelar"}
          </button>
          {!isTaskFinalized && (
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', color: 'white', backgroundColor: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Guardar Tarea")}
            </button>
          )}
        </div>
      </form>

      {/* --- SECCIONES DE DETALLE --- */}
      {isEditMode && taskData && (
        <>
          <TagSection task={taskData} />
          <CommentSection taskId={taskIdAsNumber} />
          <HistorySection taskId={taskIdAsNumber} />
        </>
      )}
    </div>
  );
}

// (Estilos reusables para el formulario - Siguen igual)
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: '500',
  marginBottom: '0.25rem'
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #D1D5DB',
  boxSizing: 'border-box'
};