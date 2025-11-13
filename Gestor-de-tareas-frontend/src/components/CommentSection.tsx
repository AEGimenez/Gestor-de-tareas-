// src/components/CommentSection.tsx
import { useState, useEffect } from 'react';
import { http } from '../utils/http';
import { useUser } from '../context/UserContext';
import { type Comment } from '../types/comment';
import { getFullName } from '../types/user';

// Componente para un solo comentario
function CommentItem({ comment }: { comment: Comment }) {
  // TODO: Implementar lógica de edición (Épica 4.2)
  const handleEdit = () => {
    alert(`Próximamente: Editar comentario #${comment.id}`);
  };

  return (
    <div style={{ borderBottom: '1px solid #E5E7EB', padding: '0.75rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
          {comment.author ? getFullName(comment.author) : '...'}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
          {new Date(comment.createdAt).toLocaleString('es-AR')}
        </span>
      </div>
      <p style={{ color: '#374151', marginTop: '0.25rem' }}>
        {comment.content}
      </p>
      {/* <button onClick={handleEdit} style={{ fontSize: '0.75rem', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}>
        Editar
      </button> 
      */}
    </div>
  );
}

// Componente principal de la sección
export function CommentSection({ taskId }: { taskId: number }) {
  const { currentUser } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Efecto para cargar los comentarios
  useEffect(() => {
    async function fetchComments() {
      setIsLoading(true);
      setError(null);
      try {
        // Llamada a GET /comments/task/:taskId (de commentRoutes.ts)
        const response = await http.get<{ data: Comment[] }>(
          `/comments/task/${taskId}`
        );
        setComments(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar los comentarios.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchComments();
  }, [taskId]); // Se recarga si el taskId cambia (aunque en este formulario no lo hará)

  // 2. Lógica para agregar un comentario
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      const payload = {
        content: newComment,
        taskId: taskId,
        authorId: currentUser.id
      };
      
      // Llamada a POST /comments (de commentRoutes.ts)
      const response = await http.post<{ data: Comment }>('/comments', payload);

      // Actualizar la UI localmente
      setComments(currentComments => [...currentComments, response.data]);
      setNewComment(""); // Limpiar el input

    } catch (err) {
      alert(`Error al agregar comentario: ${err instanceof Error ? err.message : "Error desconocido"}`);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '8px', border: '1px solid #E5E7EB', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>💬 Comentarios ({comments.length})</h3>
      
      <div style={{ marginTop: '1rem' }}>
        {isLoading && <p>Cargando comentarios...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Lista de comentarios */}
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
          {!isLoading && comments.length === 0 && (
            <p style={{ color: '#6B7280', textAlign: 'center', padding: '1rem' }}>
              No hay comentarios. ¡Sé el primero en comentar!
            </p>
          )}
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>

        {/* Formulario para agregar comentario */}
        <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Agregar comentario..."
            style={{ 
              flex: 1, 
              padding: '0.5rem', 
              borderRadius: '4px', 
              border: '1px solid #D1D5DB' 
            }}
          />
          <button 
            type="submit"
            style={{ 
              padding: '0.5rem 1rem', 
              color: 'white', 
              backgroundColor: '#10B981', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}