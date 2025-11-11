import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Header } from './src/components/Header';
import { TaskList } from './src/pages/TaskList';
import { TeamList } from './src/pages/TeamList';
import { TeamDetail } from './src/pages/TeamDetail'; // <-- 1. IMPORTAR LA NUEVA PÁGINA

// Creamos un "Layout" que siempre muestre el Header
function MainLayout() {
  return (
    <div>
      <Header />
      <main>
        {/* Outlet renderiza la ruta hija (ej: TaskList, TeamList) */}
        <Outlet /> 
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Todas las rutas principales usan el MainLayout */}
      <Route path="/" element={<MainLayout />}>
        
        <Route path="/tasks" element={<TaskList />} />
        
        {/* --- RUTAS DE EQUIPOS ACTUALIZADAS --- */}
        <Route path="/teams" element={<TeamList />} /> 
        <Route path="/teams/:id" element={<TeamDetail />} /> {/* <-- 2. AGREGAR LA RUTA DINÁMICA */}
        
        <Route path="/activity" element={<h2>Página de Actividad (Próximamente)</h2>} />
        
        {/* Redirección: si entran a / van a /tasks */}
        <Route index element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  );
}

export default App;