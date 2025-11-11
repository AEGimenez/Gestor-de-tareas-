// src/pages/TeamList.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. IMPORTAR
import { useUser } from '../context/UserContext';
import { http } from '../utils/http';
import { type TeamMembership } from '../types/team';

export function TeamList() {
  const { currentUser } = useUser();
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // <-- 2. INICIALIZAR EL HOOK

  useEffect(() => {
    async function fetchUserTeams() {
      if (!currentUser) {
        setIsLoading(false);
        setMemberships([]);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await http.get<{ data: TeamMembership[] }>(
          `/memberships/user/${currentUser.id}`
        );
        setMemberships(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la lista de equipos.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserTeams();
  }, [currentUser]);

  // --- 3. CREAR LA FUNCIÓN DE NAVEGACIÓN ---
  const handleManageClick = (teamId: number) => {
    // Esto nos llevará a la URL /teams/1 (o el id que sea)
    navigate(`/teams/${teamId}`);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Mis Equipos</h2>
        <button 
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
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!isLoading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {memberships.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
              <span style={{ fontSize: '2rem' }}>👥</span>
              <h3>No perteneces a ningún equipo</h3>
              <p>Crea un equipo o pide que te inviten a uno.</p>
            </div>
          )}

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
              
              {/* --- 4. CONECTAR EL BOTÓN AL ONCLICK --- */}
              <button 
                // Asegúrate de que tu membresía incluya 'teamId'
                // o 'team.id' si está populado
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
    </div>
  );
}