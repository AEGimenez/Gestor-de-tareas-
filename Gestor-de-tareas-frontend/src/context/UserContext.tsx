import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { type User } from '../types/user';
import { type TeamMembership } from '../types/team'; // <-- 1. Importar TeamMembership
import { http } from '../utils/http';

// 1. Definimos la forma del Contexto
interface UserContextType {
  currentUser: User | null;
  allUsers: User[];
  memberships: TeamMembership[]; // <-- 2. Añadir membresías (equipos del usuario)
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
  error: string | null;
}

// 2. Creamos el Contexto
const UserContext = createContext<UserContextType | undefined>(undefined);

// 3. Creamos el Proveedor (Provider)
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  
  // --- 3. Añadir estado para las membresías ---
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar TODOS los usuarios (para el selector)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await http.get<{ data: User[] }>("/users");
        setAllUsers(response.data);
        
        if (!currentUser && response.data.length > 0) {
          setCurrentUser(response.data[0]);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se ejecuta una vez al montar

  // --- 4. Actualizar este useEffect ---
  useEffect(() => {
    
    async function fetchUserMemberships() {
      // --- ✅ SOLUCIÓN AQUÍ ---
      // Movemos la validación DENTRO de la función async.
      // Si currentUser es null, detenemos la ejecución aquí.
      if (!currentUser) {
        setMemberships([]); // Limpiamos los equipos si no hay usuario
        return; // No intentes hacer fetch
      }
      // --- Fin de la solución ---

      try {
        // Ahora TypeScript sabe que si llegamos aquí, 
        // currentUser NO es null, por lo que currentUser.id es seguro.
        const response = await http.get<{ data: TeamMembership[] }>(
          `/memberships/user/${currentUser.id}`
        );
        setMemberships(response.data);
      } catch (err) {
        console.error("Error al cargar membresías del usuario:", err);
        setMemberships([]); // Limpiar en caso de error
      }
    }
    
    // Guardar en localStorage (esto sí puede estar fuera del async)
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }

    // Llamamos a la función
    fetchUserMemberships();

  }, [currentUser]); // <-- Se ejecuta CADA VEZ que currentUser cambia

  // --- 5. Actualizar el valor proveído ---
  const value = useMemo(() => ({
    currentUser,
    allUsers,
    memberships, // <-- Proveer las membresías
    setCurrentUser,
    isLoading,
    error,
  }), [currentUser, allUsers, memberships, isLoading, error]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// 4. Creamos un Hook personalizado (no cambia)
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}