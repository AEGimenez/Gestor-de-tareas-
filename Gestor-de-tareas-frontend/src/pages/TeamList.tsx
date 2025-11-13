// src/pages/TeamList.tsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
// ⭐️ IMPORTAR FriendlyError desde utils/http
import { http, FriendlyError } from '../utils/http'; 
import { type TeamMembership, type Team, MemberRole } from '../types/team';

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


export function TeamList() {
  const { currentUser } = useUser();
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ⭐️ Almacenamos el objeto de error para el ErrorMessage
  const [error, setError] = useState<any>(null); 
  const navigate = useNavigate();

  // Estados para el Modal de Creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  // ⭐️ Nuevo estado para errores del modal (separado del error general de carga)
  const [modalError, setModalError] = useState<string | null>(null);

  // ⭐️ FUNCIÓN CENTRAL DE CARGA (Reutilizable para useEffect y Reintento) ⭐️
  const fetchUserTeams = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      setMemberships([]);
      return;
    }
    setIsLoading(true);
    setError(null); // Limpiar error de carga
    try {
      const response = await http.get<{ data: TeamMembership[] }>(
        `/memberships/user/${currentUser.id}`
      );
      setMemberships(response.data);
    } catch (err: any) {
      // ⭐️ Capturamos el objeto de error para el componente ErrorMessage
      setError(err.message || "No se pudo cargar la lista de equipos."); 
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserTeams();
  }, [fetchUserTeams]);

  const handleManageClick = (teamId: number) => {
    navigate(`/teams/${teamId}`);
  };

  // Lógica para crear el equipo
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTeamName.trim() || isCreating) return;

    setIsCreating(true);
    setModalError(null); // Limpiar error del modal
    
    try {
      // API Call 1: Crear el equipo (POST /teams)
      const teamPayload = {
        name: newTeamName,
        description: newTeamDesc,
        ownerId: currentUser.id
      };
      // El http.post fallará y lanzará un FriendlyError si hay fallo de red o error 4xx/5xx
      const newTeamResponse = await http.post<{ data: Team }>('/teams', teamPayload);
      const newTeam = newTeamResponse.data;

      // API Call 2: Agregarse a uno mismo como Propietario (POST /memberships)
      const membershipPayload = {
        userId: currentUser.id,
        teamId: newTeam.id,
        role: MemberRole.OWNER
      };
      const newMembershipResponse = await http.post<{ data: TeamMembership }>(
        '/memberships',
        membershipPayload
      );

      // Actualizar la UI localmente
      setMemberships(current => [...current, newMembershipResponse.data]);
      
      // Limpiar y cerrar el modal
      setIsModalOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");

    } catch (err: any) {
      // ⭐️ Capturamos el error formateado y lo mostramos en el modal
      setModalError(err.message || "Error desconocido al crear el equipo."); 
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Mis Equipos</h2>
        
        <button 
          onClick={() => { setIsModalOpen(true); setModalError(null); }} // Limpiar error al abrir
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
          + Nuevo Equipo
        </button>
      </div>

      {isLoading && <p>Cargando equipos...</p>}
      
      {/* ⭐️ RENDERIZADO DEL ERROR DE CARGA ⭐️ */}
      {error && <ErrorMessage error={error} onRetry={fetchUserTeams} />}

      {!isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Estado Vacío */}
          {memberships.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
              <span style={{ fontSize: '2rem' }}>👥</span>
              <h3>No perteneces a ningún equipo</h3>
              <p>Crea un equipo o pide que te inviten a uno.</p>
            </div>
          )}

          {/* Listamos las membresías */}
          {memberships.map((membership) => (
            <div 
              key={membership.id} 
              style={{ 
                padding: '1.5rem', 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  📂 {membership.team?.name || 'Equipo no cargado'}
                </h3>
                <p style={{ color: '#6B7280' }}>
                  Tu rol: <span style={{ fontWeight: 'bold' }}>{membership.role}</span>
                </p>
              </div>
              <button 
                onClick={() => handleManageClick(membership.team?.id || membership.teamId)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Gestionar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- Modal de Creación (con manejo de error) --- */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem 2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Crear Nuevo Equipo
            </h2>
            
            {/* ⭐️ RENDERIZADO DEL ERROR DEL MODAL ⭐️ */}
            {modalError && <ErrorMessage error={modalError} />}

            <form onSubmit={handleCreateTeam}>
              <div>
                <label htmlFor="newTeamName" style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Nombre del Equipo *
                </label>
                <input 
                  type="text"
                  id="newTeamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="newTeamDesc" style={{ display: 'block', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Descripción (Opcional)
                </label>
                <textarea 
                  id="newTeamDesc"
                  rows={3}
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
                />
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  style={{
                    padding: '0.5rem 1rem',
                    color: 'white',
                    backgroundColor: '#3B82F6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    opacity: isCreating ? 0.7 : 1
                  }}
                >
                  {isCreating ? "Creando..." : "Crear Equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}