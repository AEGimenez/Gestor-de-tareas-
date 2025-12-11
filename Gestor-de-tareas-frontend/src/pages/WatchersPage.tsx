// src/pages/WatchersPage.tsx

import { useEffect, useState } from 'react';
import { http, FriendlyError, type PaginatedResponse } from '../utils/http';
import { useUser } from '../context/UserContext';
import type { TaskStatus, TaskPriority } from '../types/task';
import type { Team } from '../types/team';
import { Link } from 'react-router-dom';

// --- Tipos que matchean lo que devuelve tu back en watchlist ---
interface WatchlistItem {
  taskId: number;
  title: string;
  teamId: number;
  teamName: string;
  status: TaskStatus;
  priority: TaskPriority;
  lastUpdateAt: string;
  isOverdue: boolean;
}

// Notificación de watcher (basado en TaskWatcherNotification)
interface NotificationItem {
  id: number;
  eventType: string;
  createdAt: string;
  readAt: string | null;
  task?: {
    id: number;
    title: string;
  };
  payload?: any;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  fontWeight: 500,
  fontSize: '0.8rem',
  color: '#4B5563',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  color: '#111827',
};

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '2px 8px',
    borderRadius: 9999,
    fontSize: '0.75rem',
    backgroundColor: bg,
    color,
  };
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<string, React.CSSProperties> = {
    pendiente: badgeStyle('#FEE2E2', '#991B1B'),
    en_curso: badgeStyle('#FEF3C7', '#92400E'),
    finalizada: badgeStyle('#DCFCE7', '#166534'),
    cancelada: badgeStyle('#E5E7EB', '#374151'),
  };
  const style = map[status] ?? badgeStyle('#E5E7EB', '#374151');
  return <span style={style}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<string, React.CSSProperties> = {
    alta: badgeStyle('#FEE2E2', '#991B1B'),
    media: badgeStyle('#DBEAFE', '#1D4ED8'),
    baja: badgeStyle('#ECFDF5', '#166534'),
  };
  const style = map[priority] ?? badgeStyle('#E5E7EB', '#374151');
  return <span style={style}>{priority}</span>;
}

export function WatchersPage() {
  const { currentUser } = useUser();

  // Filtros y datos de watchlist
  const [teams, setTeams] = useState<Team[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);

  // Notificaciones
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // --- Cargar equipos para filtro ---
  useEffect(() => {
    async function loadTeams() {
      try {
        const resp = await http.get<{ data: Team[] }>('/teams');
        setTeams(resp.data || []);
      } catch (err) {
        console.error('Error cargando equipos para filtros', err);
      }
    }
    loadTeams();
  }, []);

  // --- Cargar watchlist ---
  const fetchWatchlist = async (pageToFetch = 1) => {
    if (!currentUser) return;

    setIsLoadingWatchlist(true);
    setWatchlistError(null);

    try {
      const params = new URLSearchParams();
      params.set('userId', String(currentUser.id));
      params.set('page', String(pageToFetch));
      params.set('limit', '10');

      if (statusFilter) params.set('status', statusFilter);
      if (teamFilter) params.set('teamId', teamFilter);

      const resp = await http.get<PaginatedResponse<WatchlistItem>>(
        `/watchers/watchlist?${params.toString()}`
      );

      setWatchlist(resp.data || []);
      setTotal(resp.total || 0);
      setPage(resp.page || pageToFetch);
      setTotalPages(resp.totalPages || 1);
    } catch (err: any) {
      console.error('Error cargando watchlist', err);
      const msg =
        err instanceof FriendlyError
          ? err.message
          : 'No se pudo cargar la lista de tareas que seguís.';
      setWatchlistError(msg);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  // Recargar watchlist cuando cambian filtros o usuario
  useEffect(() => {
    if (currentUser) {
      fetchWatchlist(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, statusFilter, teamFilter]);

  // --- Cargar notificaciones ---
  const fetchNotifications = async () => {
    if (!currentUser) return;

    setIsLoadingNotifications(true);
    setNotifError(null);

    try {
      const params = new URLSearchParams();
      params.set('userId', String(currentUser.id));
      params.set('unreadOnly', onlyUnread ? 'true' : 'false');

      const resp = await http.get<NotificationItem[]>(
        `/watchers/notifications?${params.toString()}`
      );
      setNotifications(resp || []);
    } catch (err: any) {
      console.error('Error cargando notificaciones', err);
      const msg =
        err instanceof FriendlyError
          ? err.message
          : 'No se pudieron cargar las notificaciones.';
      setNotifError(msg);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, onlyUnread]);

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id);
    if (!unreadIds.length) return;

    try {
      await http.patch('/watchers/notifications/read', {
        userId: currentUser.id,
        notificationIds: unreadIds,
      });
      // refrescar
      fetchNotifications();
    } catch (err) {
      console.error('Error marcando notificaciones como leídas', err);
    }
  };

  const handleUnwatchFromList = async (item: WatchlistItem) => {
    if (!currentUser) return;
    try {
      await http.delete(`/tasks/${item.taskId}/watchers/${currentUser.id}`);
      fetchWatchlist(page);
      fetchNotifications();
    } catch (err) {
      console.error('Error al dejar de seguir desde watchlist', err);
    }
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentUser) {
    return (
      <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Watchers
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#6B7280' }}>
          Para ver tus tareas seguidas y notificaciones, primero seleccioná un usuario en la
          esquina superior derecha.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Watchers
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem' }}>
        Acá podés ver todas las tareas que estás siguiendo y las notificaciones que genera
        cada cambio.
      </p>

      {/* ---- SECCIÓN WATCHLIST ---- */}
      <section style={{ marginBottom: '2rem' }}>
        <div
          style={{
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
            Mis tareas seguidas
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
            Total: <strong>{total}</strong>
          </span>
        </div>

        {/* Filtros */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
              }}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
              Equipo
            </label>
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                minWidth: 160,
              }}
            >
              <option value="">Todos</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {watchlistError && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 6,
              backgroundColor: '#FEE2E2',
              border: '1px solid #EF4444',
              color: '#991B1B',
              fontSize: '0.85rem',
            }}
          >
            {watchlistError}
          </div>
        )}

        {isLoadingWatchlist ? (
          <p>Cargando tareas seguidas...</p>
        ) : watchlist.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>
            Todavía no estás siguiendo ninguna tarea. Entrá al detalle de una tarea y
            usá el botón “Suscribirme”.
          </p>
        ) : (
          <div
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: '0.75rem',
            }}
          >
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}
            >
              <thead style={{ backgroundColor: '#F3F4F6' }}>
                <tr>
                  <th style={thStyle}>Tarea</th>
                  <th style={thStyle}>Equipo</th>
                  <th style={thStyle}>Estado</th>
                  <th style={thStyle}>Prioridad</th>
                  <th style={thStyle}>Último cambio</th>
                  <th style={thStyle}>Alertas</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(item => (
                  <tr key={item.taskId} style={{ borderTop: '1px solid #E5E7EB' }}>
                    <td style={tdStyle}>
                      <Link
                        to={`/tasks/${item.taskId}`}
                        style={{ color: '#1D4ED8', textDecoration: 'none' }}
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td style={tdStyle}>{item.teamName}</td>
                    <td style={tdStyle}>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={tdStyle}>
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td style={tdStyle}>{formatDateTime(item.lastUpdateAt)}</td>
                    <td style={tdStyle}>
                      {item.isOverdue && (
                        <span
                          style={badgeStyle('#FEE2E2', '#B91C1C')}
                        >
                          ⏰ Vencida
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleUnwatchFromList(item)}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.35rem 0.7rem',
                          borderRadius: 9999,
                          border: '1px solid #D1D5DB',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Dejar de seguir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div
              style={{
                padding: '0.75rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                backgroundColor: '#F9FAFB',
              }}
            >
              <span>
                Página {page} de {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => fetchWatchlist(page - 1)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: 9999,
                    border: '1px solid #D1D5DB',
                    backgroundColor: page <= 1 ? '#E5E7EB' : 'white',
                    color: page <= 1 ? '#9CA3AF' : '#111827',
                    cursor: page <= 1 ? 'default' : 'pointer',
                  }}
                >
                  ← Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchWatchlist(page + 1)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: 9999,
                    border: '1px solid #D1D5DB',
                    backgroundColor: page >= totalPages ? '#E5E7EB' : 'white',
                    color: page >= totalPages ? '#9CA3AF' : '#111827',
                    cursor: page >= totalPages ? 'default' : 'pointer',
                  }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---- SECCIÓN NOTIFICACIONES ---- */}
      <section>
        <div
          style={{
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
              Notificaciones
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>
              Cambios registrados en las tareas que seguís.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', display: 'flex', gap: '0.35rem' }}>
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={e => setOnlyUnread(e.target.checked)}
              />
              Ver solo no leídas
            </label>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={!notifications.some(n => !n.readAt)}
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.9rem',
                borderRadius: 9999,
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                cursor: notifications.some(n => !n.readAt) ? 'pointer' : 'default',
              }}
            >
              Marcar todas como leídas
            </button>
          </div>
        </div>

        {notifError && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 6,
              backgroundColor: '#FEE2E2',
              border: '1px solid #EF4444',
              color: '#991B1B',
              fontSize: '0.85rem',
            }}
          >
            {notifError}
          </div>
        )}

        {isLoadingNotifications ? (
          <p>Cargando notificaciones...</p>
        ) : notifications.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>
            No tenés notificaciones para mostrar con los filtros actuales.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map(notif => (
              <li
                key={notif.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  marginBottom: '0.5rem',
                  backgroundColor: notif.readAt ? 'white' : '#EEF2FF',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                    <strong>
                      {notif.task ? (
                        <Link
                          to={`/tasks/${notif.task.id}`}
                          style={{ color: '#1D4ED8', textDecoration: 'none' }}
                        >
                          {notif.task.title}
                        </Link>
                      ) : (
                        'Tarea'
                      )}
                    </strong>{' '}
                    — {notif.eventType}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#6B7280',
                    }}
                  >
                    {formatDateTime(notif.createdAt)}
                  </span>
                </div>

                {notif.payload && (
                  <pre
                    style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      color: '#6B7280',
                      backgroundColor: '#F9FAFB',
                      padding: '0.5rem',
                      borderRadius: 6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {JSON.stringify(notif.payload, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
