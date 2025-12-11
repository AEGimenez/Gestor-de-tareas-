// src/components/WatchersSection.tsx
import { useEffect, useState } from 'react';
import { http } from '../utils/http';
import { useUser } from '../context/UserContext';
import type { Task } from '../types/task';
import type { User } from '../types/user';

interface TaskWatcherDto {
  id: number;
  userId: number;
  taskId: number;
  createdAt: string;
  user?: User; // si el back hace join con user
}

function getInitials(user: User) {
  const first = user.firstName?.[0] ?? '';
  const last = user.lastName?.[0] ?? '';
  const initials = (first + last).trim();
  return initials ? initials.toUpperCase() : '?';
}

export function WatchersSection({ task }: { task: Task }) {
  const { currentUser } = useUser();

  const [watchers, setWatchers] = useState<TaskWatcherDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Cargar watchers de la tarea
  const loadWatchers = async () => {
    if (!task.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // ⬅️ IMPORTANTE: usamos EXACTAMENTE el path del Swagger
      // GET /tasks/{taskId}/watchers
      const resp = await http.get<any>(`/tasks/${task.id}/watchers`);

      // Permitimos varias formas de respuesta
      const list: TaskWatcherDto[] =
        Array.isArray(resp) ? resp : resp.data || resp.watchers || [];

      setWatchers(list || []);
    } catch (err: any) {
      console.error('Error cargando watchers:', err);
      setError(err?.message || 'No se pudieron cargar los watchers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  const isWatching =
    !!currentUser && watchers.some(w => (w.user?.id ?? w.userId) === currentUser.id);

  // 🔹 Suscribirse / desuscribirse
  const handleToggle = async () => {
    if (!currentUser) {
      alert('Elegí un usuario en el selector de arriba para poder seguir la tarea.');
      return;
    }
    if (!task.id) return;

    setIsToggling(true);
    setError(null);

    try {
      if (!isWatching) {
        // ⬅️ POST /tasks/{taskId}/watchers
        await http.post(`/tasks/${task.id}/watchers`, {
          userId: currentUser.id,
        });
      } else {
        // ⬅️ DELETE /tasks/{taskId}/watchers/{userId}
        await http.delete(`/tasks/${task.id}/watchers/${currentUser.id}`);
      }

      await loadWatchers();
    } catch (err: any) {
      console.error('Error actualizando suscripción:', err);
      setError(
        err?.message || 'No se pudo actualizar la suscripción a las novedades de la tarea.'
      );
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <section
      style={{
        marginTop: '2rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
            👀 Watchers de la tarea
          </h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem' }}>
            Usuarios suscriptos a las novedades de esta tarea.
          </p>
        </div>

        {task.id && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling || !currentUser}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              border: 'none',
              cursor: isToggling ? 'default' : 'pointer',
              backgroundColor: isWatching ? '#F97373' : '#3B82F6',
              color: 'white',
              fontSize: '0.9rem',
              opacity: isToggling ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            {isWatching ? 'Dejar de seguir' : 'Suscribirme'}
          </button>
        )}
      </div>

      {error && (
        <p
          style={{
            color: '#B91C1C',
            fontSize: '0.85rem',
            marginBottom: '0.5rem',
          }}
        >
          {error}
        </p>
      )}

      {isLoading ? (
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Cargando watchers...
        </p>
      ) : watchers.length === 0 ? (
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>
          Esta tarea todavía no tiene watchers. ¡Podés ser la primera en seguirla!
        </p>
      ) : (
        <div>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.9rem',
              color: '#374151',
            }}
          >
            <strong>{watchers.length}</strong>{' '}
            {watchers.length === 1
              ? 'persona siguiendo esta tarea'
              : 'personas siguiendo esta tarea'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {watchers.map(w =>
              w.user ? (
                <div
                  key={w.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    backgroundColor: '#EEF2FF',
                    border: '1px solid #E0E7FF',
                    fontSize: '0.85rem',
                    color: '#3730A3',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '999px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '0.4rem',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  >
                    {getInitials(w.user)}
                  </div>
                  <span style={{ fontWeight: 500 }}>
                    {w.user.firstName} {w.user.lastName}
                  </span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </section>
  );
}
