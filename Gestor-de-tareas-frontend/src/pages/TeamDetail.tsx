import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { http } from '../utils/http';
import { type Team, type TeamMembership, MemberRole } from '../types/team';
import { getFullName, type User } from '../types/user';

// --- (El componente MemberCard sigue igual) ---
function MemberCard({ member, isOwner, onMemberRemoved }: {
  member: TeamMembership,
  isOwner: boolean,
  onMemberRemoved: (userId: number) => void 
}) {
  const handleRemove = async () => {
    if (!member.user) return;
    const userName = getFullName(member.user);
    const userIdToRemove = member.userId;
    const teamIdOfMember = member.teamId;

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas remover a ${userName} del equipo?`
    );
    if (!confirmed) return;

    try {
      await http.delete(
        `/memberships/team/${teamIdOfMember}/user/${userIdToRemove}`
      );
      onMemberRemoved(userIdToRemove);
    } catch (err) {
      alert(`Error al eliminar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };
  const isSelf = member.role === MemberRole.OWNER;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
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
  
  // --- ✅ LÍNEA CORREGIDA ---
  // Inicializamos el estado de error en 'null'
  const [error, setError] = useState<string | null>(null);

  // --- Estados para el formulario de edición ---
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [userToInviteId, setUserToInviteId] = useState<string>("");

  const isOwner = useMemo(() => {
    const myMembership = members.find(m => m.userId === currentUser?.id);
    return myMembership?.role === MemberRole.OWNER;
  }, [currentUser, members]);

  // (El useEffect para cargar datos ahora también setea los estados del formulario)
  useEffect(() => {
    if (!teamId) {
      setError("No se especificó un ID de equipo.");
      setIsLoading(false);
      return;
    }
    async function fetchData() {
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
          // Inicializar estados del formulario
          setTeamName(loadedTeam.name);
          setTeamDesc(loadedTeam.description || "");
        } else {
          console.warn("No se pudo cargar la info del equipo desde las membresías.");
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el detalle del equipo.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [teamId]);

  const handleMemberRemoved = (removedUserId: number) => {
    setMembers(currentMembers =>
      currentMembers.filter(member => member.userId !== removedUserId)
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToInviteId || !teamId) {
      alert("Por favor, selecciona un usuario.");
      return;
    }
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
    } catch (err) {
      alert(`Error al invitar: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  // (Lógica de Guardar Cambios)
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return;

    if (!teamName.trim()) {
      alert("El nombre del equipo no puede estar vacío.");
      return;
    }
    
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

    } catch (err) {
      if (err instanceof Error) {
        alert(`Error al guardar: ${err.message}`);
      } else {
        alert("Ocurrió un error desconocido.");
      }
    }
  };


  if (isLoading) return <div style={{ padding: '2rem' }}>Cargando detalle del equipo...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  if (!team) return <div style={{ padding: '2im' }}>Equipo no encontrado.</div>;

  // (El JSX/HTML de abajo sigue igual)
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
                disabled={!isOwner}
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
                disabled={!isOwner}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
              />
            </div>

            {isOwner && (
              <button type="submit" style={{ marginTop: '1rem', padding: '0.5rem 1rem', color: 'white', backgroundColor: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Guardar Cambios
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