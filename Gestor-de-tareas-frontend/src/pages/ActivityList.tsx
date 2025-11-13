import { useState, useEffect } from 'react';
import { http } from '../utils/http';
import { useUser } from '../context/UserContext';
import { type Activity, ActivityType } from '../types/activity';
import { getFullName } from '../types/user';
import { Link } from 'react-router-dom';

// Supuesto: Tipo de dato de equipo (necesario para el frontend)
interface Team {
  id: number;
  name: string;
}

// Helper para obtener el icono según el tipo
function getActivityIcon(type: ActivityType | string): string {
  switch (type) {
    case ActivityType.TASK_CREATED: return '🆕';
    case ActivityType.COMMENT_ADDED: return '💬';
    case ActivityType.STATUS_CHANGED: return '✏️';
    default: return '📄';
  }
}

const ActivityTypeLabels: Record<ActivityType, string> = {
  [ActivityType.TASK_CREATED]: "Tarea Creada",
  [ActivityType.STATUS_CHANGED]: "Estado Cambiado",
  [ActivityType.COMMENT_ADDED]: "Comentario Añadido",
};

// Componente para una sola entrada de actividad
function ActivityItem({ activity }: { activity: Activity }) {
  const actorName = activity.actor ? getFullName(activity.actor) : 'Usuario desconocido';
  const teamName = activity.team?.name || 'Equipo no especificado';
  const timeAgo = new Date(activity.createdAt).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
  
  // URL para ver la tarea (si existe)
  const taskUrl = activity.task ? `/tasks/${activity.task.id}` : '#';

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 'bold' }}>
          {getActivityIcon(activity.type)} <span style={{ color: '#3B82F6' }}>@{actorName}</span>
          <span style={{ fontWeight: 'normal', color: '#4B5563', marginLeft: '0.5rem' }}>
            {activity.description || ` realizó una acción tipo ${activity.type}`}
          </span>
        </p>
        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
          {timeAgo}
        </span>
      </div>
      
      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4B5563' }}>
        {activity.team && (
          <span>en equipo <strong>{teamName}</strong></span>
        )}
        {activity.task && (
          <Link to={taskUrl} style={{ marginLeft: '1rem', color: '#10B981', textDecoration: 'none' }}>
            [Ver tarea →]
          </Link>
        )}
      </div>
    </div>
  );
}

export function ActivityList() {
  const { currentUser } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>(""); 
  const [teamFilter, setTeamFilter] = useState<string>(""); 
  
  // ⭐️ ESTADO CLAVE: Bandera para saber si la carga inicial de equipos ya se completó.
  const [teamsLoaded, setTeamsLoaded] = useState(false);


  // --- EFECTO 1: Cargar equipos del usuario y establecer filtro inicial ---
  useEffect(() => {
    async function fetchUserTeams() {
        if (!currentUser?.id) {
             setTeamsLoaded(true); // No hay usuario, terminamos la fase de inicialización.
             setIsLoading(false); // Detenemos la carga inicial.
             return;
        }

        try {
            const response = await http.get<{ data: Team[] }>(`/teams/user/${currentUser.id}`);
            const fetchedTeams = response.data;
            
            setUserTeams(fetchedTeams);
            
            // Si encontramos equipos, establecemos el primero como filtro por defecto.
            if (fetchedTeams.length > 0) {
                 setTeamFilter(String(fetchedTeams[0].id));
            } else {
                 setTeamFilter(""); // Si no hay equipos, queda en "Todos"
            }
        } catch (err) {
            console.error("Error al cargar los equipos del usuario:", err);
            setTeamFilter(""); // Si falla, queda en "Todos"
        } finally {
            setTeamsLoaded(true); // ⭐️ INDICAMOS QUE LA FASE DE INICIALIZACIÓN DE EQUIPOS TERMINÓ
        }
    }
    fetchUserTeams();
  }, [currentUser?.id]);

  // --- EFECTO 2: Cargar el feed de actividad (Se dispara al cambiar filtros y al terminar la inicialización) ---
  useEffect(() => {
    // ⭐️ CORRECCIÓN CLAVE: No disparamos la búsqueda hasta que la carga de equipos haya terminado.
    if (!teamsLoaded) {
        return;
    }
    
    // Si no hay usuario, el efecto 1 ya resolvió isLoading.
    if (!currentUser?.id) {
        return; 
    }

    async function fetchActivity() {
      setIsLoading(true); // Se inicia la carga
      setError(null);
      
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      
      // Enviamos teamId solo si no es la cadena vacía ("Todos")
      if (teamFilter) params.append('teamId', teamFilter);
      const queryString = params.toString();

      try {
        const response = await http.get<{ data: Activity[] }>(`/activity?${queryString}`);
        setActivities(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el feed de actividad.");
      } finally {
        setIsLoading(false); // ⭐️ RESUELVE EL ESTADO DE CARGA CONSTANTE.
      }
    }
    
    fetchActivity(); 
    
  }, [typeFilter, teamFilter, teamsLoaded, currentUser?.id]);


  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        📊 Actividad Reciente (Usuario: {currentUser?.firstName})
      </h2>

      {/* Barra de Filtros (Simple) */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#F3F4F6', padding: '1rem', borderRadius: '8px' }}>
        
        {/* Filtro por Tipo */}
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">Tipo (Todos)</option>
          {Object.entries(ActivityTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
                {label} 
            </option>
          ))}
        </select>
        
        {/* Filtro por Equipo */}
        <select 
            value={teamFilter} 
            onChange={(e) => setTeamFilter(e.target.value)} 
            style={filterSelectStyle} 
        >
           <option value="">Equipo (Todos)</option>
           {userTeams.map(team => (
             <option key={team.id} value={team.id}>
                {team.name}
             </option>
           ))}
        </select>

      </div>

      {/* Contenedor del Feed */}
      <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
        
        {/* Mostramos el mensaje de carga solo si isLoading es TRUE */}
        {isLoading && <p style={{ padding: '1rem', textAlign: 'center' }}>⏳ Cargando actividad...</p>}
        
        {/* Solo mostramos los resultados o el mensaje de vacío cuando NO estamos cargando */}
        {!isLoading && activities.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'white' }}>
            <span style={{ fontSize: '2rem' }}>📄</span>
            <h3>No hay actividad reciente</h3>
            <p>El feed se actualizará cuando se creen tareas o comentarios.</p>
          </div>
        )}

        {!isLoading && activities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

const filterSelectStyle: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #D1D5DB',
  backgroundColor: 'white',
  fontSize: '0.875rem' 
};