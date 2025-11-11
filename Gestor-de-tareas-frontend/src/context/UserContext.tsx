import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { type User } from '../types/user';
import { http } from '../utils/http';

// 1. Definimos la forma del Contexto
interface UserContextType {
  currentUser: User | null;
  allUsers: User[];
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
    // Inicializa el usuario desde localStorage si existe
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar TODOS los usuarios (para el selector)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await http.get<{ data: User[] }>("/users");
        setAllUsers(response.data);
        
        // Si no hay usuario en localStorage, seleccionamos el primero de la lista
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

  // Efecto para guardar el usuario actual en localStorage cuando cambie
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Usamos useMemo para evitar renders innecesarios
  const value = useMemo(() => ({
    currentUser,
    allUsers,
    setCurrentUser,
    isLoading,
    error,
  }), [currentUser, allUsers, isLoading, error]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// 4. Creamos un Hook personalizado para consumir el contexto fácilmente
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}