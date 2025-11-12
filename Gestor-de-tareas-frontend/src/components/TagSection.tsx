// src/components/TagSection.tsx
import { useState, useEffect } from 'react';
import { http } from '../utils/http';
import { type Task } from '../types/task';
import { type Tag } from '../types/tag';

// Componente para un solo "chip" de etiqueta
function TagChip({ tag, onRemove }: { tag: Tag, onRemove: (tagId: number) => void }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      margin: '2px',
      backgroundColor: '#E0E7FF', // indigo-100
      color: '#3730A3', // indigo-800
      borderRadius: '12px',
      fontSize: '0.875rem',
      fontWeight: '500',
    }}>
      {tag.name}
      <button 
        onClick={() => onRemove(tag.id)}
        style={{
          marginLeft: '4px',
          background: 'none',
          border: 'none',
          color: '#4F46E5', // indigo-600
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        ✕
      </button>
    </span>
  );
}

// Componente principal de la sección
export function TagSection({ task, isTaskFinalized }: { task: Task, isTaskFinalized: boolean }) {
  // Lista de todas las etiquetas disponibles en el sistema (para el dropdown)
  const [allTags, setAllTags] = useState<Tag[]>([]);
  
  // Lista de las etiquetas *actualmente asignadas* a esta tarea
  const [assignedTags, setAssignedTags] = useState<Tag[]>(() => {
    // Inicializamos con las etiquetas que vienen en la tarea
    return task.taskTags?.map(tt => tt.tag) || [];
  });
  
  const [tagToAddId, setTagToAddId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. Cargar todas las etiquetas disponibles (para el <select>)
  useEffect(() => {
    http.get<{ data: Tag[] }>('/tags')
      .then(response => setAllTags(response.data))
      .catch(err => console.error("Error al cargar etiquetas:", err));
  }, []);

  // 2. Filtrar las etiquetas que se pueden añadir (todas menos las ya asignadas)
  const availableTagsToAdd = allTags.filter(
    allTag => !assignedTags.some(assignedTag => assignedTag.id === allTag.id)
  );

  // 3. Lógica para añadir un chip (solo localmente)
  const handleAddTag = () => {
    if (!tagToAddId) return;
    
    const tag = allTags.find(t => t.id === Number(tagToAddId));
    if (tag) {
      setAssignedTags(current => [...current, tag]);
      setTagToAddId(""); // Resetea el select
    }
  };

  // 4. Lógica para quitar un chip (solo localmente)
  const handleRemoveTag = (tagIdToRemove: number) => {
    setAssignedTags(current => current.filter(t => t.id !== tagIdToRemove));
  };
  
  // 5. Lógica para guardar los cambios en el Backend
  const handleSaveTags = async () => {
    setIsSaving(true);
    try {
      // Creamos el payload de IDs: [1, 2, 5]
      const tagIds = assignedTags.map(t => t.id);
      
      // Llamamos al nuevo endpoint del backend
      await http.put(`/tasks/${task.id}/tags`, { tagIds });

      alert("¡Etiquetas actualizadas!");

    } catch (err) {
      alert(`Error al guardar etiquetas: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderRadius: '8px', border: '1px solid #E5E7EB', marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>🏷️ Etiquetas</h3>
      
      {/* Contenedor de chips de etiquetas asignadas */}
      <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '6px', minHeight: '40px' }}>
        {assignedTags.length === 0 ? (
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Sin etiquetas asignadas.</p>
        ) : (
          assignedTags.map(tag => (
            <TagChip key={tag.id} tag={tag} onRemove={handleRemoveTag} />
          ))
        )}
      </div>

      {/* Selector para añadir nuevas etiquetas */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <select 
          value={tagToAddId}
          onChange={(e) => setTagToAddId(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }}
        >
          <option value="">Seleccionar etiqueta...</option>
          {availableTagsToAdd.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddTag}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          + Agregar
        </button>
      </div>

      {/* Botón de Guardar (SÍ se muestra aunque la tarea esté finalizada) */}
      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button
          type="button"
          onClick={handleSaveTags}
          disabled={isSaving}
          style={{
            padding: '0.5rem 1rem',
            color: 'white',
            backgroundColor: '#3B82F6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? "Guardando..." : "Guardar Etiquetas"}
        </button>
      </div>
    </div>
  );
}