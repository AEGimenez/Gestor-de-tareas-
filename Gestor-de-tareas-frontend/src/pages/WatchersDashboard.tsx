// src/pages/WatchersDashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { http, FriendlyError, type PaginatedResponse } from '../utils/http';
import { useUser } from '../context/UserContext';
import type { Task } from '../types/task';

interface WatchlistItem {
  taskId: number;
  title: string;
  status: string;
  priority: string;
  teamName?: string;
  updatedAt?: string;
  isOverdue?: boolean;
}

interface NotificationItem {
  id: number;
  eventType: string;
  createdAt: string;
  readAt?: string | null;
  task?: Task;
}

export function WatchersDashboard() {
  const { currentUser } = useUser();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const watchlistResponse = await http.get<PaginatedResponse<WatchlistItem>>(
        `/watchers/watchlist?userId=${currentUser.id}`
      );
      setWatchlist(watchlistResponse.data ?? []);

      const notificationsResponse = await http.get<NotificationItem[]>(
        `/watchers/notifications?userId=${currentUser.id}&unreadOnly=false`
      );
      setNotifications(notificationsResponse);
    } catch (err: any) {
      console.error(err);
      setError(
        err instanceof FriendlyError ? err.message : 'No se pudieron cargar los datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    const unreadIds = notifications
      .filter((n) => !n.readAt)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await http.patch<void>('/watchers/notifications/read', {
        userId: currentUser.id,
        notificationIds: unreadIds,
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert('No se pudieron marcar como leídas.');
    }
  };

  if (!currentUser) {
    return <p>Elegí un usuario en la parte superior para ver su watchlist.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>📋 Watchlist de tareas</h2>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid #D1D5DB',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p style={{ color: '#B91C1C' }}>{error}</p>
        ) : watchlist.length === 0 ? (
          <p>No estás siguiendo ninguna tarea.</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '0.5rem' }}>Tarea</th>
                <th style={{ padding: '0.5rem' }}>Equipo</th>
                <th style={{ padding: '0.5rem' }}>Estado</th>
                <th style={{ padding: '0.5rem' }}>Prioridad</th>
                <th style={{ padding: '0.5rem' }}>Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item) => (
                <tr key={item.taskId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <Link to={`/tasks/${item.taskId}`}>{item.title}</Link>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{item.teamName ?? '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{item.status}</td>
                  <td style={{ padding: '0.5rem' }}>{item.priority}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleString('es-AR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>🔔 Notificaciones</h2>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={notifications.every((n) => n.readAt)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#E5E7EB',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Marcar todas como leídas
          </button>
        </div>

        {notifications.length === 0 ? (
          <p>No tenés notificaciones aún.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.map((n) => (
              <li
                key={n.id}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  marginBottom: '0.4rem',
                  backgroundColor: n.readAt ? '#F9FAFB' : '#DBEAFE',
                }}
              >
                <div style={{ fontSize: '0.9rem' }}>
                  <strong>{n.eventType}</strong>{' '}
                  {n.task && (
                    <>
                      en la tarea{' '}
                      <Link to={`/tasks/${n.task.id}`}>{n.task.title}</Link>
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    marginTop: '0.15rem',
                  }}
                >
                  {new Date(n.createdAt).toLocaleString('es-AR')}
                  {n.readAt && ' · leída'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
