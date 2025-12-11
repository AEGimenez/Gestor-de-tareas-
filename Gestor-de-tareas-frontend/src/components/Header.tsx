import { Link } from 'react-router-dom';
import { UserSelector } from './UserSelector';

export function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      backgroundColor: '#234b81ff', // bg-gray-800
      color: 'white',
      borderBottom: '1px solid #374151' // border-gray-700
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Gestoria Gimenez 
        </h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
      <Link to="/tasks" style={{ color: 'white', textDecoration: 'none' }}>
       Tareas
      </Link>
      <Link to="/teams" style={{ color: 'white', textDecoration: 'none' }}>
       Equipos
      </Link>
      <Link to="/activity" style={{ color: 'white', textDecoration: 'none' }}>
       Actividad
      </Link>
      <Link to="/watchers" style={{ color: 'white', textDecoration: 'none' }}>
       Watchers
      </Link>
      </nav>
      </div>
      
     
      <UserSelector />
    </header>
  );
}