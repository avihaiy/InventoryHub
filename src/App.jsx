import React, { useState, useEffect } from 'react';
import { PackageSearch, LogOut, Users, MapPin, Activity, Plus, X } from 'lucide-react';
import { supabase } from './supabase';
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
      try { return JSON.parse(saved); } catch (e) { return null; }
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Subscribe to Supabase collections (Real-time syncing)
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: itemsData }, { data: locData }, { data: logData }, { data: usersData }] = await Promise.all([
        supabase.from('items').select('*').order('createdAt', { ascending: false }),
        supabase.from('locations').select('*'),
        supabase.from('activityLogs').select('*').order('timestamp', { ascending: false }),
        supabase.from('users').select('*')
      ]);

      if (itemsData) setItems(itemsData);
      if (locData) setLocations(locData);
      if (logData) setActivityLogs(logData);
      
      if (usersData) {
        if (!usersData.some(u => u.email === DEFAULT_ADMIN.email)) setUsers([DEFAULT_ADMIN, ...usersData]);
        else setUsers(usersData);
      }
    };
    
    fetchData();

    // Realtime Subscriptions
    const itemsSub = supabase.channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, async () => {
         const { data } = await supabase.from('items').select('*').order('createdAt', { ascending: false });
         if (data) setItems(data);
      }).subscribe();

    const locSub = supabase.channel('locations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, async () => {
         const { data } = await supabase.from('locations').select('*');
         if (data) setLocations(data);
      }).subscribe();

    const logsSub = supabase.channel('logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activityLogs' }, async () => {
         const { data } = await supabase.from('activityLogs').select('*').order('timestamp', { ascending: false });
         if (data) setActivityLogs(data);
      }).subscribe();

    const usersSub = supabase.channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
         const { data } = await supabase.from('users').select('*');
         if (data) {
           if (!data.some(u => u.email === DEFAULT_ADMIN.email)) setUsers([DEFAULT_ADMIN, ...data]);
           else setUsers(data);
         }
      }).subscribe();

    return () => {
      supabase.removeChannel(itemsSub);
      supabase.removeChannel(locSub);
      supabase.removeChannel(logsSub);
      supabase.removeChannel(usersSub);
    };
  }, []);

  // One-time data migration from localStorage to Supabase
  useEffect(() => {
    const migrateData = async () => {
      const hasMigrated = localStorage.getItem('migratedToSupabase');
      if (!hasMigrated) {
        try {
          const localItems = JSON.parse(localStorage.getItem('inventoryData') || '[]');
          const localLogs = JSON.parse(localStorage.getItem('inventoryLogs') || '[]');
          const localLocations = JSON.parse(localStorage.getItem('inventoryLocations') || '[]');
          const localUsers = JSON.parse(localStorage.getItem('inventoryUsers') || '[]');

          let count = 0;
          if (localItems.length > 0) {
             const itemsToInsert = localItems.map(i => ({ ...i, createdAt: i.createdAt || new Date().toISOString() }));
             await supabase.from('items').upsert(itemsToInsert);
             count += itemsToInsert.length;
          }
          if (localLocations.length > 0) {
             await supabase.from('locations').upsert(localLocations);
             count += localLocations.length;
          }
          if (localLogs.length > 0) {
             await supabase.from('activityLogs').upsert(localLogs);
             count += localLogs.length;
          }
          if (localUsers.length > 0) {
             const usersToInsert = localUsers.filter(u => u.id !== DEFAULT_ADMIN.id);
             if (usersToInsert.length > 0) {
                await supabase.from('users').upsert(usersToInsert);
                count += usersToInsert.length;
             }
          }

          if (count > 0) {
             console.log(`Migrated ${count} records to Supabase`);
          }
          localStorage.setItem('migratedToSupabase', 'true');
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
      const { error } = await supabase.from('activityLogs').insert([log]);
      if (error) console.error(error);
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
        const itemsToInsert = newItems.map(item => ({ ...item, createdAt: new Date().toISOString() }));
        const { error } = await supabase.from('items').insert(itemsToInsert);
        if (error) throw error;
        logActivity('ADD', newItems[0].itemName, `נוספו ${newItems.length} רשומות חדשות`);
      } else {
        const itemToInsert = { ...newItems, createdAt: new Date().toISOString() };
        const { error } = await supabase.from('items').insert([itemToInsert]);
        if (error) throw error;
        logActivity('ADD', newItems.itemName, `נוסף פריט. אינוונטר: ${newItems.inventoryNumber}`);
      }
    } catch(e) {
      alert("שגיאה בשמירה לענן: " + e.message);
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const { error } = await supabase.from('items').update(updatedItem).eq('id', updatedItem.id);
      if (error) throw error;
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
        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
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
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;
    } catch(e) { alert("שגיאה בהוספת משתמש: " + e.message); }
  };

  const handleDeleteUser = async (id) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.email === DEFAULT_ADMIN.email) {
      alert('לא ניתן למחוק את המנהל הראשי.');
      return;
    }
    
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
      } catch(e) { alert("שגיאה במחיקת משתמש: " + e.message); }
    }
  };

  const handleAddLocation = async (newLocation) => {
    try {
      // Remove createdAt to match schema
      const { createdAt, ...locationToInsert } = newLocation;
      const { error } = await supabase.from('locations').insert([locationToInsert]);
      if (error) throw error;
    } catch(e) { alert("שגיאה בהוספת מיקום: " + e.message); }
  };

  const handleDeleteLocation = async (id) => {
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
    } catch(e) { alert("שגיאה במחיקת מיקום: " + e.message); }
  };

  const clearLogs = async () => {
    if (window.confirm('למחוק את כל היסטוריית הפעולות?')) {
       // Delete all rows trick in Supabase
       await supabase.from('activityLogs').delete().neq('id', 'dummy'); 
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
          {!showUserManagement && !showLocationManagement && !showActivityLog && (
            <>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary hide-on-mobile btn-icon"
                title="הוסף פריט"
              >
                <Plus size={20} />
                <span>הוסף פריט</span>
              </button>
              <ExportButton items={items} />
            </>
          )}
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
            <InventoryTable 
              items={items} 
              onDeleteItem={handleDeleteItem} 
              onUpdateItem={handleUpdateItem}
              userRole={currentUser.role}
              locations={locations}
            />
            
            {/* Mobile Floating Action Button */}
            <button 
              className="fab-btn md:hidden"
              onClick={() => setIsAddModalOpen(true)}
              title="הוסף פריט"
            >
              <Plus size={28} />
            </button>

            {/* Modal for Add Item */}
            {isAddModalOpen && (
              <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
                <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                    <X size={20} />
                  </button>
                  <InventoryForm 
                    onAddItem={(items) => {
                      handleAddItem(items);
                      setIsAddModalOpen(false); // Close automatically after success
                    }} 
                    locations={locations} 
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
