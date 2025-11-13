import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Header } from './src/components/Header';
import { TaskList } from './src/pages/TaskList';
import { TeamList } from './src/pages/TeamList';
import { TeamDetail } from './src/pages/TeamDetail';
import { TaskForm } from './src/pages/TaskForm'; 
import { ActivityList } from './src/pages/ActivityList';

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
        
        {/* Rutas de Tareas y Equipos siguen igual */}
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/new" element={<TaskForm />} /> 
        <Route path="/tasks/:id" element={<TaskForm />} /> 
        <Route path="/teams" element={<TeamList />} /> 
        <Route path="/teams/:id" element={<TeamDetail />} />
        
        {/* --- 2. CONECTAR LA RUTA /ACTIVITY --- */}
        <Route path="/activity" element={<ActivityList />} /> 
        
        <Route index element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  );
}

export default App;