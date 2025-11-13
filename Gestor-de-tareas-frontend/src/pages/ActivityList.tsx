import { useState, useEffect } from 'react';
import { http } from '../utils/http';
import { useUser } from '../context/UserContext';
import { type Activity, ActivityType } from '../types/activity';
import { getFullName } from '../types/user';
import { Link } from 'react-router-dom';
// ⭐️ Asumo que exportas FriendlyError desde tu utils/http
import { FriendlyError } from '../utils/http'; 

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

// ⭐️ INICIO DEL COMPONENTE DE MANEJO DE ERRORES ⭐️
interface ErrorProps {
    error: Error | string | null;
    onRetry: () => void;
}

const errorContainerStyle: React.CSSProperties = {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#FFF0F0',
    border: '1px solid #FFC0C0',
    borderRadius: '8px',
    margin: '2rem 0',
};

const ErrorMessage: React.FC<ErrorProps> = ({ error, onRetry }) => {
    if (!error) return null;

    const message = error instanceof Error ? error.message : String(error);
    let icon = '❌'; 
    let title = 'Error al cargar datos';

    // Lógica para identificar el error de Conexión (basado en el mensaje de http.ts)
    if (error instanceof FriendlyError && message.includes("Error de Conexión")) {
        icon = '⚠️'; 
        title = '¡Sin Conexión!';
    } else if (error instanceof FriendlyError && (message.includes('404') || message.includes('no encontrado'))) {
        title = 'Elemento no encontrado';
    }


    return (
        <div style={errorContainerStyle}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>{icon}</p>
            <h3 style={{ margin: '0 0 0.5rem', color: '#CC0000' }}>{title}</h3>
            <p style={{ margin: '0 0 1rem', color: '#333' }}>{message}</p>
            
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
        </div>
    );
};
// ⭐️ FIN DEL COMPONENTE DE MANEJO DE ERRORES ⭐️


export function ActivityList() {
  const { currentUser } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>(""); 
  const [teamFilter, setTeamFilter] = useState<string>(""); 
  
  const [teamsLoaded, setTeamsLoaded] = useState(false);


  // --- EFECTO 1: Cargar equipos del usuario y establecer filtro inicial ---
  useEffect(() => {
    async function fetchUserTeams() {
        if (!currentUser?.id) {
             setTeamsLoaded(true);
             setIsLoading(false);
             return;
        }

        try {
            const response = await http.get<{ data: Team[] }>(`/teams/user/${currentUser.id}`);
            const fetchedTeams = response.data;
            
            setUserTeams(fetchedTeams);
            
            if (fetchedTeams.length > 0) {
                 setTeamFilter(String(fetchedTeams[0].id));
            } else {
                 setTeamFilter("");
            }
        } catch (err) {
            console.error("Error al cargar los equipos del usuario:", err);
            setTeamFilter(""); 
        } finally {
            setTeamsLoaded(true);
        }
    }
    fetchUserTeams();
  }, [currentUser?.id]);

  // --- EFECTO 2: Cargar el feed de actividad ---
  useEffect(() => {
    if (!teamsLoaded) {
        return;
    }
    
    if (!currentUser?.id) {
        return; 
    }

    // ⭐️ FUNCIÓN PARA REINTENTAR ⭐️
    async function fetchActivity() {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      
      if (teamFilter) params.append('teamId', teamFilter);
      const queryString = params.toString();

      try {
        const response = await http.get<{ data: Activity[] }>(`/activity?${queryString}`);
        setActivities(response.data);
      } catch (err: any) { // Usamos any para manejar errores personalizados
        // ⭐️ Capturamos el error formateado y lo guardamos
        setError(err); 
      } finally {
        setIsLoading(false); 
      }
    }
    
    // ⭐️ Limpiar error si hay un cambio de filtro
    if (error) setError(null);
    fetchActivity(); 
    
    // Incluimos error en la dependencia para que el reintento funcione si se llama a fetchActivity.
  }, [typeFilter, teamFilter, teamsLoaded, currentUser?.id]);
  
  // ⭐️ Manejador de Reintento ⭐️
  const handleRetry = () => {
      // Al cambiar la dependencia, se dispara el useEffect de fetchActivity
      // Usamos el error como indicador de que algo cambió.
      setError(null); 
  };


  // ⭐️ RENDERIZADO PRINCIPAL CON EL COMPONENTE DE ERROR ⭐️
  if (error) return (
      <div style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              📊 Actividad Reciente (Usuario: {currentUser?.firstName})
          </h2>
          <ErrorMessage error={error} onRetry={handleRetry} />
      </div>
  );

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