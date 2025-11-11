import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { http } from '../utils/http';
import { useUser } from '../context/UserContext';
import { TaskStatus, TaskPriority, type Task } from '../types/task';
import { type TeamMembership } from '../types/team'; 
import { getFullName, type User } from '../types/user'; 
import { CommentSection } from '../components/CommentSection';
import { HistorySection } from '../components/HistorySection';

// --- FRAGMENTO 1 (Ahora sí se usará) ---
// (Esta es la constante que te daba el error "is declared but its value is never read")
const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [], // No se puede cambiar
  [TaskStatus.CANCELLED]: [], // No se puede cambiar
};

export function TaskForm() {
  const navigate = useNavigate();
  const { currentUser, memberships } = useUser(); 
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const taskIdAsNumber = Number(id);

  // (Estados del formulario)
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // (useEffect para cargar datos en Modo Edición - Sigue igual)
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      http.get<Task>(`/tasks/${id}`)
        .then(data => {
          setTaskData(data);
          setTitle(data.title);
          setDescription(data.description || "");
          setStatus(data.status);
          setPriority(data.priority);
          setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "");
          setAssignedToId(data.assignedToId?.toString() || "");
          setTeamId(data.teamId.toString());
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : "No se pudo cargar la tarea.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, isEditMode]);

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
        const members = response.data
          .map(m => m.user)
          .filter(Boolean) as User[]; 

        setTeamMembers(members);

        if (assignedToId && !members.some(m => m.id === Number(assignedToId))) {
          setAssignedToId("");
        }

      } catch (err) {
        console.error("Error al cargar miembros del equipo:", err);
        setTeamMembers([]);
      } finally {
        setIsMembersLoading(false);
      }
    }
    fetchTeamMembers();
  }, [teamId, assignedToId]); // (Añadimos assignedToId a la dependencia por si acaso)


  // (Lógica de Tarea Finalizada - Sigue igual)
  const isTaskFinalized = 
    taskData?.status === TaskStatus.COMPLETED || 
    taskData?.status === TaskStatus.CANCELLED;

  // (handleSubmit - Sigue igual)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !currentUser) return;
    if (!title.trim()) { setError("El título es obligatorio."); return; }
    if (!teamId) { setError("Debes seleccionar un equipo."); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const payload = {
          title, description, status, priority,
          dueDate: dueDate || null,
          assignedToId: assignedToId ? Number(assignedToId) : null,
          teamId: Number(teamId),
          changedById: currentUser.id
        };
        await http.patch(`/tasks/${id}`, payload);
        alert("¡Tarea actualizada exitosamente!");
        navigate('/tasks');
        
      } else {
        const payload = {
          title, description, status, priority,
          dueDate: dueDate || null,
          assignedToId: assignedToId ? Number(assignedToId) : null,
          teamId: Number(teamId),
          createdById: currentUser.id
        };
        await http.post('/tasks', payload);
        alert("¡Tarea creada exitosamente!");
        navigate('/tasks');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMsg);
      alert(`Error al guardar: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading && isEditMode) return <div style={{ padding: '2rem' }}>Cargando tarea...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/tasks" style={{ textDecoration: 'none', color: '#3B82F6' }}>
        &larr; Volver a Tareas
      </Link>
      
      <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '1rem 0' }}>
        {isEditMode ? `Editar Tarea #${id}` : 'Crear Nueva Tarea'}
      </h2>

      {/* --- FRAGMENTO 2 CORREGIDO --- */}
      {/* (Aquí estaba el error "Expression expected") */}
      {isTaskFinalized && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', borderRadius: '6px', marginBottom: '1rem' }}>
          ⚠️ Esta tarea está finalizada o cancelada. Solo se pueden editar comentarios y etiquetas (próximamente).
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}
      >
        {/* ... (Título, Descripción, Equipo siguen igual) ... */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title" style={labelStyle}>Título *</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isTaskFinalized} style={inputStyle} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={labelStyle}>Descripción</label>
          <textarea id="description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isTaskFinalized} style={inputStyle} />
        </div>
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
            {/* --- FRAGMENTO 1 CORREGIDO --- */}
            {/* (Aquí es donde 'allowedTransitions' se USA) */}
            <select 
              id="status" 
              value={status} 
              onChange={(e) => setStatus(e.target.value as TaskStatus)} 
              disabled={isTaskFinalized} 
              style={inputStyle}
            >
              {isEditMode ? (
                <>
                  {/* Muestra el estado actual como la opción seleccionada */}
                  <option value={taskData?.status}>{status}</option> 
                  {/* Mapea solo las transiciones permitidas */}
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

        {/* ... (Botones de Acción y Error) ... */}
        {error && ( <div style={{ color: 'red', marginBottom: '1rem', fontWeight: 'bold' }}> Error: {error} </div> )}
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

      {/* --- (Secciones de Comentarios e Historial - Siguen igual) --- */}
      {isEditMode && (
        <>
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