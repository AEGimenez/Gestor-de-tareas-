import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Header } from './src/components/Header';
import { TaskList } from './src/pages/TaskList';
import { TeamList } from './src/pages/TeamList';
import { TeamDetail } from './src/pages/TeamDetail';
import { TaskForm } from './src/pages/TaskForm'; 

// (MainLayout sigue igual)
function MainLayout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet /> 
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        
        {/* --- RUTAS DE TAREAS ACTUALIZADAS --- */}
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/new" element={<TaskForm />} /> 
        <Route path="/tasks/:id" element={<TaskForm />} /> {/* <-- AGREGAR RUTA DE EDICIÓN */}
        
        {/* Rutas de Equipos */}
        <Route path="/teams" element={<TeamList />} /> 
        <Route path="/teams/:id" element={<TeamDetail />} />
        
        <Route path="/activity" element={<h2>Página de Actividad (Próximamente)</h2>} />
        
        <Route index element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  );
}

export default App;