import { useState, useEffect } from 'react';
// Importaciones relativas dentro de la carpeta 'src/'
import { http } from './src/utils/http'; 
// Marcamos 'User' como un 'type' para cumplir con "verbatimModuleSyntax"
import { type User, getFullName } from './src/types/user';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // La URL es leída de Gestor-de-tareas-frontend/.env (VITE_API_URL=http://localhost:3000)
    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("API URL Base:", apiUrl);
    
    // Función para obtener usuarios del backend
    async function fetchUsers() {
      try {
        // Llamada a GET http://localhost:3000/users
        // El endpoint devuelve { message: ..., data: User[] }
        const response = await http.get<{ data: User[] }>("/users");
        setUsers(response.data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Un error desconocido ocurrió al obtener los usuarios.");
        }
      } finally {
        setLoading(false);
      }
    }

    // Asegúrate de que tu backend esté corriendo
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem', color: '#1f2937' }}>👤 Selector de Usuario Actual (Prueba de Conexión)</h1>
      <p style={{ color: '#4b5563', marginBottom: '20px' }}>
        API URL Usada: <strong>{import.meta.env.VITE_API_URL}/users</strong>
      </p>
      
      {loading && (
        <p style={{ color: '#10b981', fontWeight: 'bold' }}>⏳ Cargando usuarios...</p>
      )}
      
      {error && (
        <div style={{ 
          color: '#ef4444', 
          border: '1px solid #fca5a5', 
          backgroundColor: '#fef2f2', 
          padding: '15px', 
          borderRadius: '8px' 
        }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 10px 0' }}>❌ Error de Conexión</h2>
          <p>Asegúrate de que tu **Backend** esté corriendo en **http://localhost:3000**.</p>
          <p style={{ fontWeight: 'bold' }}>Detalle del error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#374151', margin: '0 0 15px 0' }}>
            Usuarios Disponibles ({users.length})
          </h2>
          <select 
            style={{ 
              padding: '10px', 
              fontSize: '16px', 
              width: '100%', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px'
            }}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {getFullName(user)} ({user.email})
              </option>
            ))}
          </select>

          {users.length === 0 && (
            <p style={{ color: '#9ca3af', marginTop: '10px' }}>
              No se encontraron usuarios. Asegúrate de que los Seeds de tu backend hayan sido ejecutados.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;