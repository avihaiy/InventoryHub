import React, { useState, useEffect } from 'react';
import { PackageSearch, LogOut, Users, MapPin, Activity } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
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

  const [users, setUsers] = useState([DEFAULT_ADMIN]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showLocationManagement, setShowLocationManagement] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // Subscribe to Firestore collections (Real-time syncing)
  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'items'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      setItems(data.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    });

    const unsubLocations = onSnapshot(collection(db, 'locations'), (snapshot) => {
      setLocations(snapshot.docs.map(d => d.data()));
    });

    const unsubLogs = onSnapshot(collection(db, 'activityLogs'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      setActivityLogs(data.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      if (!data.some(u => u.email === DEFAULT_ADMIN.email)) {
        setUsers([DEFAULT_ADMIN, ...data]);
      } else {
        setUsers(data);
      }
    });

    return () => {
      unsubItems(); unsubLocations(); unsubLogs(); unsubUsers();
    };
  }, []);

  // One-time data migration from localStorage to Firestore
  useEffect(() => {
    const migrateData = async () => {
      const hasMigrated = localStorage.getItem('migratedToFirebase');
      if (!hasMigrated) {
        try {
          const localItems = JSON.parse(localStorage.getItem('inventoryData') || '[]');
          const localLogs = JSON.parse(localStorage.getItem('inventoryLogs') || '[]');
          const localLocations = JSON.parse(localStorage.getItem('inventoryLocations') || '[]');
          const localUsers = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');

          const allDocs = [];
          localItems.forEach(i => allDocs.push({ col: 'items', id: i.id, data: { ...i, createdAt: i.createdAt || new Date().toISOString() } }));
          localLocations.forEach(i => allDocs.push({ col: 'locations', id: i.id, data: i }));
          localLogs.forEach(i => allDocs.push({ col: 'activityLogs', id: i.id, data: i }));
          localUsers.forEach(i => { 
            if(i.id !== DEFAULT_ADMIN.id) allDocs.push({ col: 'users', id: i.id, data: i }); 
          });

          if (allDocs.length > 0) {
             console.log(`Migrating ${allDocs.length} records to Firestore...`);
             const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
             const chunks = chunkArray(allDocs, 450); // max batch size is 500
             
             for (const chunk of chunks) {
               const batch = writeBatch(db);
               chunk.forEach(docItem => {
                 batch.set(doc(db, docItem.col, docItem.id), docItem.data);
               });
               await batch.commit();
             }
          }
          localStorage.setItem('migratedToFirebase', 'true');
        } catch (e) {
          console.error("Migration failed: ", e);
        }
      }
    };
    migrateData();
  }, []);

  const logActivity = async (action, itemName, details) => {
    const log = {
      id: generateId(),
      action,
      itemName,
      details,
      user: currentUser?.email || 'מערכת',
      timestamp: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'activityLogs', log.id), log);
    } catch(e) { console.error(e); }
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

  const handleAddItem = async (newItems) => {
    try {
      if (Array.isArray(newItems)) {
        const batch = writeBatch(db);
        newItems.forEach(item => {
          const data = { ...item, createdAt: new Date().toISOString() };
          batch.set(doc(db, 'items', item.id), data);
        });
        await batch.commit();
        logActivity('ADD', newItems[0].itemName, `נוספו ${newItems.length} רשומות חדשות`);
      } else {
        const data = { ...newItems, createdAt: new Date().toISOString() };
        await setDoc(doc(db, 'items', newItems.id), data);
        logActivity('ADD', newItems.itemName, `נוסף פריט. אינוונטר: ${newItems.inventoryNumber}`);
      }
    } catch(e) {
      alert("שגיאה בשמירה לענן: " + e.message);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      await setDoc(doc(db, 'items', updatedItem.id), updatedItem);
      logActivity('UPDATE', updatedItem.itemName, `עודכן פריט. אינוונטר: ${updatedItem.inventoryNumber}`);
    } catch(e) {
      alert("שגיאה בעדכון: " + e.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (currentUser?.role !== 'admin') {
      alert('אין לך הרשאות למחוק פריטים.');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      const itemToDelete = items.find(item => item.id === id);
      try {
        await deleteDoc(doc(db, 'items', id));
        if (itemToDelete) {
          logActivity('DELETE', itemToDelete.itemName, `נמחק פריט. אינוונטר: ${itemToDelete.inventoryNumber}`);
        }
      } catch(e) {
        alert("שגיאה במחיקה: " + e.message);
      }
    }
  };

  const handleAddUser = async (newUser) => {
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch(e) { alert("שגיאה בהוספת משתמש"); }
  };

  const handleDeleteUser = async (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.email === DEFAULT_ADMIN.email) {
      alert('לא ניתן למחוק את המנהל הראשי.');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch(e) { alert("שגיאה במחיקת משתמש"); }
    }
  };

  const handleAddLocation = async (newLocation) => {
    try {
      await setDoc(doc(db, 'locations', newLocation.id), newLocation);
    } catch(e) { alert("שגיאה בהוספת מיקום"); }
  };

  const handleDeleteLocation = async (id) => {
    try {
      await deleteDoc(doc(db, 'locations', id));
    } catch(e) { alert("שגיאה במחיקת מיקום"); }
  };

  const clearLogs = async () => {
    if (window.confirm('למחוק את כל היסטוריית הפעולות?')) {
       // Since it could be many, we will delete them in chunks
       const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
       const chunks = chunkArray(activityLogs, 450);
       for (const chunk of chunks) {
         const batch = writeBatch(db);
         chunk.forEach(log => {
           batch.delete(doc(db, 'activityLogs', log.id));
         });
         await batch.commit();
       }
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
            onClear={clearLogs} 
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
