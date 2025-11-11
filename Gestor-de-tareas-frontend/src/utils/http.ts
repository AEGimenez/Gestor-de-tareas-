// src/utils/http.ts

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Función genérica que envuelve a fetch para manejar:
 * 1. URL base y endpoint.
 * 2. Headers por defecto (Content-Type: application/json).
 * 3. Serialización del body para POST/PUT/PATCH.
 * 4. Manejo centralizado de errores (incluyendo errores HTTP).
 * 5. Parseo automático de la respuesta JSON.
 * @param endpoint - Ruta específica de la API (ej: "/users", "/tasks/1")
 * @param options - Opciones estándar de fetch (method, body, headers, etc.)
 */
export async function httpRequest<T>( // <-- Exportando httpRequest
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    ...options,
    headers: {
      // Configuramos el Content-Type para enviar JSON por defecto
      "Content-Type": "application/json", 
      ...options.headers,
    },
  };

  // Si se proporciona data en el body (para POST/PUT/PATCH), la serializamos
  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  // Combinamos la URL base con el endpoint
  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    // Intenta parsear el error del servidor (ej: { message: "Error..." })
    const errorBody = await response.json().catch(() => ({}));
    
    // Lanzamos un error con un mensaje del servidor o un mensaje genérico
    throw new Error(errorBody.message || `HTTP Error: ${response.status} - ${response.statusText}`);
  }

  // Manejo de respuesta vacía (ej: 204 No Content para DELETE)
  if (response.status === 204) {
    return undefined as T; // Retorna void/undefined
  }

  // Devolvemos el JSON parseado y tipado
  return response.json();
}

/**
 * Helpers para métodos HTTP comunes
 */
export const http = { // <-- Exportando el objeto http
  get: <T>(endpoint: string) => httpRequest<T>(endpoint, { method: "GET" }),

    post: <T>(endpoint: string, data?: unknown) =>
    httpRequest<T>(endpoint, {
      method: "POST",
      // SOLUCIÓN: Pasamos 'data' como un tipo compatible con RequestInit['body']
      // Dado que nuestro wrapper lo serializa si es un objeto, forzamos la conversión aquí:
      body: data as RequestInit['body'], 
    }),

    put: <T>(endpoint: string, data?: unknown) =>
    httpRequest<T>(endpoint, {
      method: "PUT",
      body: data as RequestInit['body'],
    }),

    patch: <T>(endpoint: string, data?: unknown) => 
    httpRequest<T>(endpoint, {
      method: "PATCH",
      body: data as RequestInit['body'],
    }),

  delete: <T>(endpoint: string) =>
    httpRequest<T>(endpoint, { method: "DELETE" }),
};


// Interfaz para la respuesta paginada, necesaria en el frontend
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}