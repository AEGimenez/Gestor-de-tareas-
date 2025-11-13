import { useUser } from '../context/UserContext';
import { getFullName } from '../types/user';

export function UserSelector() {
  const { allUsers, currentUser, setCurrentUser, isLoading } = useUser();

  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = Number(event.target.value);
    const selectedUser = allUsers.find(user => user.id === selectedUserId) || null;
    setCurrentUser(selectedUser);
  };

  if (isLoading) {
    return <div style={{ color: 'white', padding: '10px' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '8px' }}>
      <span style={{ color: 'white', marginRight: '8px' }}>👤</span>
      <select 
        value={currentUser?.id || ''} 
        onChange={handleUserChange}
        style={{
          backgroundColor: '#4B5563', // bg-gray-600
          color: 'white',
          border: '1px solid #6B7280', // border-gray-500
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer'
        }}
      >
        {allUsers.map(user => (
          <option key={user.id} value={user.id}>
            {getFullName(user)}
          </option>
        ))}
      </select>
    </div>
  );
}