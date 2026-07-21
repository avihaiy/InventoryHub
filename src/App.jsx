import React, { useState, useEffect } from 'react';
import { PackageSearch, LogOut, Users, MapPin, Activity } from 'lucide-react';
import InventoryForm from './components/InventoryForm';
import InventoryTable from './components/InventoryTable';
import ExportButton from './components/ExportButton';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import LocationManagement from './components/LocationManagement';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import './index.css';

const DEFAULT_ADMIN = {
  id: 'admin-001',
  email: 'avihai@akko.muni.il',
  password: 'As0546526856',
  role: 'admin',
  createdAt: new Date().toISOString()
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem('inventoryLocations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('inventoryLogs');
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
  const [showLocationManagement, setShowLocationManagement] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('inventoryData', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('inventoryUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('inventoryLocations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('inventoryLogs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  const logActivity = (action, itemName, details) => {
    const log = {
      id: generateId(),
      action,
      itemName,
      details,
      user: currentUser?.email || 'מערכת',
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [log, ...prev].slice(0, 200)); // שמירת 200 הפעולות האחרונות
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setShowUserManagement(false);
    setShowLocationManagement(false);
    setShowActivityLog(false);
  };

  const handleAddItem = (newItems) => {
    if (Array.isArray(newItems)) {
      setItems(prev => [...newItems, ...prev]);
      logActivity('ADD', newItems[0].itemName, `נוספו ${newItems.length} רשומות חדשות`);
    } else {
      setItems(prev => [newItems, ...prev]);
      logActivity('ADD', newItems.itemName, `נוסף פריט. אינוונטר: ${newItems.inventoryNumber}`);
    }
  };

  const handleUpdateItem = (updatedItem) => {
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    logActivity('UPDATE', updatedItem.itemName, `עודכן פריט. אינוונטר: ${updatedItem.inventoryNumber}`);
  };

  const handleDeleteItem = (id) => {
    if (currentUser?.role !== 'admin') {
      alert('אין לך הרשאות למחוק פריטים.');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      const itemToDelete = items.find(item => item.id === id);
      setItems(prev => prev.filter(item => item.id !== id));
      if (itemToDelete) {
        logActivity('DELETE', itemToDelete.itemName, `נמחק פריט. אינוונטר: ${itemToDelete.inventoryNumber}`);
      }
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

  const handleAddLocation = (newLocation) => {
    setLocations(prev => [...prev, newLocation]);
  };

  const handleDeleteLocation = (id) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
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
            <>
              <button 
                onClick={() => { setShowLocationManagement(true); setShowUserManagement(false); setShowActivityLog(false); }} 
                className={`btn ${showLocationManagement ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="ניהול מיקומים"
              >
                <MapPin size={20} />
                <span className="hide-on-mobile">מיקומים</span>
              </button>
              <button 
                onClick={() => { setShowUserManagement(true); setShowLocationManagement(false); setShowActivityLog(false); }} 
                className={`btn ${showUserManagement ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="ניהול משתמשים"
              >
                <Users size={20} />
                <span className="hide-on-mobile">משתמשים</span>
              </button>
              <button 
                onClick={() => { setShowActivityLog(true); setShowLocationManagement(false); setShowUserManagement(false); }} 
                className={`btn ${showActivityLog ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="יומן פעולות"
              >
                <Activity size={20} />
                <span className="hide-on-mobile">פעולות</span>
              </button>
            </>
          )}
          {!showUserManagement && !showLocationManagement && !showActivityLog && <ExportButton items={items} />}
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
        ) : showLocationManagement && currentUser.role === 'admin' ? (
          <LocationManagement 
            locations={locations} 
            onAddLocation={handleAddLocation} 
            onDeleteLocation={handleDeleteLocation}
            onBack={() => setShowLocationManagement(false)}
          />
        ) : showActivityLog && currentUser.role === 'admin' ? (
          <ActivityLog 
            logs={activityLogs} 
            onClear={() => window.confirm('למחוק את כל היסטוריית הפעולות?') && setActivityLogs([])} 
          />
        ) : (
          <>
            <Dashboard items={items} locations={locations} />
            <InventoryForm onAddItem={handleAddItem} locations={locations} />
            <InventoryTable 
              items={items} 
              onDeleteItem={handleDeleteItem} 
              onUpdateItem={handleUpdateItem}
              userRole={currentUser.role}
              locations={locations}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
