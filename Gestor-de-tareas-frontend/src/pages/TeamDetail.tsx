import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
// ⭐️ IMPORTAR FriendlyError desde utils/http
import { http, FriendlyError } from '../utils/http'; 
import { type Team, type TeamMembership, MemberRole } from '../types/team';
import { getFullName, type User } from '../types/user';

// ⭐️ INICIO DEL COMPONENTE DE MANEJO DE ERRORES (Reutilizado) ⭐️
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
    margin: '1rem 0',
};

// Componente para mostrar errores con estilo amigable
const ErrorMessage: React.FC<ErrorProps> = ({ error, onRetry }) => {
    if (!error) return null;

    const message = error instanceof Error ? error.message : String(error);
    let icon = '❌'; 
    let title = 'Error de Proceso';

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


// --- (El componente MemberCard será ajustado para usar el manejo de errores) ---
function MemberCard({ member, isOwner, onMemberRemoved }: {
  member: TeamMembership,
  isOwner: boolean,
  onMemberRemoved: (userId: number, errorCallback: (msg: string) => void) => void // ⭐️ callback de error
}) {
    const [removalError, setRemovalError] = useState<string | null>(null);

    const handleRemove = async () => {
        if (!member.user) return;
        const userName = getFullName(member.user);
        const userIdToRemove = member.userId;
        const teamIdOfMember = member.teamId;

        const confirmed = window.confirm(
            `¿Estás seguro de que deseas remover a ${userName} del equipo?`
        );
        if (!confirmed) return;
        
        setRemovalError(null);

        try {
            await http.delete(
                `/memberships/team/${teamIdOfMember}/user/${userIdToRemove}`
            );
            // Si tiene éxito, llamamos al callback para actualizar la UI
            onMemberRemoved(userIdToRemove, () => {}); 
        } catch (err: any) {
            // ⭐️ Captura y muestra el error amigable SOLO en la tarjeta
            setRemovalError(err.message || "Error desconocido al remover."); 
        }
    };
    
    const isSelf = member.role === MemberRole.OWNER;
    return (
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontWeight: 'bold' }}>
                        {isSelf ? '👑' : '👤'} {member.user ? getFullName(member.user) : 'Usuario...'}
                    </span>
                    <span style={{ marginLeft: '0.5rem', color: '#6B7280' }}>({member.role})</span>
                </div>
                {isOwner && !isSelf && (
                    <button onClick={handleRemove} style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', color: '#EF4444', backgroundColor: 'transparent', border: '1px solid #EF4444', borderRadius: '4px', cursor: 'pointer' }}>
                        Remover
                    </button>
                )}
            </div>
            {removalError && (
                <div style={{ color: '#CC0000', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {removalError}
                </div>
            )}
        </div>
    );
}
// --- (Fin del componente MemberCard) ---


export function TeamDetail() {
  const { id: teamId } = useParams();
  const { currentUser } = useUser();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ⭐️ Almacenamos el objeto de error
  const [error, setError] = useState<any>(null);

  // --- Estados para el formulario de edición ---
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [userToInviteId, setUserToInviteId] = useState<string>("");
  // ⭐️ Nuevo estado para errores de acción
  const [actionError, setActionError] = useState<string | null>(null); 
  const [isSaving, setIsSaving] = useState(false);

  const isOwner = useMemo(() => {
    const myMembership = members.find(m => m.userId === currentUser?.id);
    return myMembership?.role === MemberRole.OWNER;
  }, [currentUser, members]);

  // ⭐️ FUNCIÓN CENTRAL DE CARGA: Reutilizable para el useEffect y para reintentar ⭐️
  const fetchData = useCallback(async () => {
    if (!teamId) {
      setError("No se especificó un ID de equipo.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [membersResponse, usersResponse] = await Promise.all([
        http.get<{ data: TeamMembership[] }>(`/memberships/team/${teamId}`),
        http.get<{ data: User[] }>('/users')
      ]);
      
      const loadedMembers = membersResponse.data;
      setMembers(loadedMembers);
      setAllUsers(usersResponse.data);

      if (loadedMembers.length > 0 && loadedMembers[0].team) {
        const loadedTeam = loadedMembers[0].team;
        setTeam(loadedTeam);
        setTeamName(loadedTeam.name);
        setTeamDesc(loadedTeam.description || "");
      } else {
        console.warn("No se pudo cargar la info del equipo desde las membresías.");
      }
      
    } catch (err: any) {
      // ⭐️ Capturamos el objeto de error formateado
      setError(err.message || "No se pudo cargar el detalle del equipo.");
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ⭐️ Manejador de Reintento para la carga inicial
  const handleRetry = () => {
      fetchData();
  };

  const handleMemberRemoved = (removedUserId: number) => {
    setMembers(currentMembers =>
      currentMembers.filter(member => member.userId !== removedUserId)
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToInviteId || !teamId) {
      setActionError("Por favor, selecciona un usuario.");
      return;
    }
    setActionError(null);
    try {
      const payload = {
        userId: Number(userToInviteId),
        teamId: Number(teamId),
        role: MemberRole.MEMBER
      };
      const newMembership = await http.post<{ data: TeamMembership }>(
        '/memberships',
        payload
      );
      setMembers(currentMembers => [...currentMembers, newMembership.data]);
      setUserToInviteId("");
    } catch (err: any) {
      // ⭐️ Usamos el error formateado
      setActionError(err.message || "Error desconocido al invitar.");
    }
  };

  // (Lógica de Guardar Cambios)
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;

    if (!teamName.trim()) {
      setActionError("El nombre del equipo no puede estar vacío.");
      return;
    }
    
    setActionError(null);
    setIsSaving(true);
    
    try {
      const payload = {
        name: teamName,
        description: teamDesc,
      };

      const updatedTeam = await http.patch<{ data: Team }>(
        `/teams/${teamId}`,
        payload
      );

      setTeam(updatedTeam.data);
      alert("¡Equipo actualizado correctamente!");

    } catch (err: any) {
      // ⭐️ Usamos el error formateado
      setActionError(err.message || "Ocurrió un error desconocido al guardar.");
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) return <div style={{ padding: '2rem' }}>Cargando detalle del equipo...</div>;
  
  // ⭐️ RENDERIZADO DEL ERROR DE CARGA (Con opción de reintento)
  if (error) return (
        <div style={{ padding: '2rem' }}>
            <Link to="/teams" style={{ textDecoration: 'none', color: '#3B82F6' }}>
                &larr; Volver a Equipos
            </Link>
            <ErrorMessage error={error} onRetry={handleRetry} />
        </div>
    );
    
  if (!team) return <div style={{ padding: '2im' }}>Equipo no encontrado.</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/teams" style={{ textDecoration: 'none', color: '#3B82F6' }}>
        &larr; Volver a Equipos
      </Link>
      
      <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '1rem 0' }}>
        Gestionar: {team.name}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Columna Izquierda: Editar y Miembros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Formulario de Edición */}
          <form onSubmit={handleSaveChanges} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Información del Equipo</h3>
            
            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="teamName" style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Nombre del Equipo *</label>
              <input 
                type="text" 
                id="teamName"
                value={teamName} 
                onChange={(e) => setTeamName(e.target.value)} 
                disabled={!isOwner || isSaving}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="teamDesc" style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Descripción</label>
              <textarea 
                id="teamDesc"
                rows={4}
                value={teamDesc} 
                onChange={(e) => setTeamDesc(e.target.value)} 
                disabled={!isOwner || isSaving}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>
            
            {/* ⭐️ Mostrar error de acción si existe (no de carga inicial) ⭐️ */}
            {actionError && <div style={{ color: 'red', marginTop: '1rem', fontWeight: 'bold' }}>Error: {actionError}</div>}

            {isOwner && (
              <button type="submit" disabled={isSaving} style={{ marginTop: '1rem', padding: '0.5rem 1rem', color: 'white', backgroundColor: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </form>
          
          {/* Lista de Miembros */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Miembros ({members.length})</h3>
            <div style={{ marginTop: '1rem' }}>
              {members.map(member => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  isOwner={isOwner} 
                  onMemberRemoved={handleMemberRemoved}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Invitar (Solo para Propietarios) */}
        {isOwner && (
          <form onSubmit={handleInvite} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E5E7EB', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Invitar Nuevo Miembro</h3>
            <div style={{ marginTop: '1rem' }}>
              <label htmlFor="inviteUser" style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>Usuario</label>
              <select 
                id="inviteUser" 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                value={userToInviteId}
                onChange={(e) => setUserToInviteId(e.target.value)}
              >
                <option value="">Seleccionar usuario...</option>
                {allUsers
                  .filter(user => !members.some(m => m.userId === user.id))
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {getFullName(user)} ({user.email})
                    </option>
                  ))}
              </select>
            </div>
            <button type="submit" style={{ marginTop: '1rem', width: '100%', padding: '0.5rem 1rem', color: 'white', backgroundColor: '#10B981', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Invitar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}