import React, { useState, useEffect } from 'react';
import { PackageSearch, LogOut, Users } from 'lucide-react';
import InventoryForm from './components/InventoryForm';
import InventoryTable from './components/InventoryTable';
import ExportButton from './components/ExportButton';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import './index.css';

const DEFAULT_ADMIN = {
  id: 'admin-001',
  email: 'avihai@akko.muni.il',
  password: 'As0546526856',
  role: 'admin',
  createdAt: new Date().toISOString()
};

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('inventoryUsers');
    if (saved) {
      try {
        const parsedUsers = JSON.parse(saved);
        // Ensure master admin exists
        if (!parsedUsers.some(u => u.email === DEFAULT_ADMIN.email)) {
          return [DEFAULT_ADMIN, ...parsedUsers];
        }
        return parsedUsers;
      } catch (e) {
        return [DEFAULT_ADMIN];
      }
    }
    return [DEFAULT_ADMIN];
  });

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('inventoryData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [showUserManagement, setShowUserManagement] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('inventoryData', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('inventoryUsers', JSON.stringify(users));
  }, [users]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setShowUserManagement(false);
  };

  const handleAddItem = (newItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  const handleDeleteItem = (id) => {
    if (currentUser?.role !== 'admin') {
      alert('אין לך הרשאות למחוק פריטים.');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddUser = (newUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleDeleteUser = (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.email === DEFAULT_ADMIN.email) {
      alert('לא ניתן למחוק את המנהל הראשי.');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="header animate-slide-in">
        <h1>
          <PackageSearch size={36} className="text-accent" />
          מערכת ניהול מלאי
        </h1>
        <div className="header-actions">
          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setShowUserManagement(!showUserManagement)} 
              className={`btn ${showUserManagement ? 'btn-primary' : 'btn-secondary'} btn-icon`}
              title="ניהול משתמשים"
            >
              <Users size={20} />
              <span className="hide-on-mobile">משתמשים</span>
            </button>
          )}
          {!showUserManagement && <ExportButton items={items} />}
          <button onClick={handleLogout} className="btn btn-danger btn-icon">
            <LogOut size={20} />
            <span className="hide-on-mobile">התנתק</span>
          </button>
        </div>
      </header>
      
      <main>
        {showUserManagement && currentUser.role === 'admin' ? (
          <UserManagement 
            users={users} 
            onAddUser={handleAddUser} 
            onDeleteUser={handleDeleteUser}
            onBack={() => setShowUserManagement(false)}
          />
        ) : (
          <>
            <InventoryForm onAddItem={handleAddItem} />
            <InventoryTable 
              items={items} 
              onDeleteItem={handleDeleteItem} 
              userRole={currentUser.role}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
