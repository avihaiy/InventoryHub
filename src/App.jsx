import React, { useState, useEffect } from 'react';
import { PackageSearch, LogOut, Users, MapPin, Activity, Plus, X, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from './supabase';
import InventoryForm from './components/InventoryForm';
import InventoryTable from './components/InventoryTable';
import ExportButton from './components/ExportButton';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import LocationManagement from './components/LocationManagement';
import Dashboard from './components/Dashboard';
import ActivityLog from './components/ActivityLog';
import Settings from './components/Settings';
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
  const [showSettings, setShowSettings] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPrefill, setAddModalPrefill] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Offline Queue Logic ---
  const addToOfflineQueue = (type, payload) => {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    queue.push({ id: generateId(), type, payload, timestamp: Date.now() });
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
  };

  const processOfflineQueue = async () => {
    if (!navigator.onLine) return;
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    if (queue.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    const failedQueue = [];

    for (const task of queue) {
      try {
        if (task.type === 'ADD_ITEM') {
          const { error } = await supabase.from('items').insert(task.payload);
          if (error) throw error;
        } else if (task.type === 'UPDATE_ITEM') {
          const { error } = await supabase.from('items').update(task.payload).eq('id', task.payload.id);
          if (error) throw error;
        } else if (task.type === 'DELETE_ITEM') {
          const { error } = await supabase.from('items').delete().eq('id', task.payload);
          if (error) throw error;
        }
        successCount++;
      } catch (e) {
        console.error("Failed to sync offline task:", e);
        failedQueue.push(task);
      }
    }

    localStorage.setItem('offlineQueue', JSON.stringify(failedQueue));
    setIsSyncing(false);

    if (successCount > 0) {
      const { data } = await supabase.from('items').select('*').order('createdAt', { ascending: false });
      if (data) setItems(data);
    }
  };

  useEffect(() => {
    window.addEventListener('online', processOfflineQueue);
    if (navigator.onLine) processOfflineQueue();
    return () => window.removeEventListener('online', processOfflineQueue);
  }, []);
  // ---------------------------

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
      
      try {
        const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'default').single();
        if (settingsData) setSettings(settingsData);
      } catch (e) {
        // Table might not exist yet, ignore
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

  const sendTelegramAlert = (text) => {
    if (settings?.telegram_bot_token && settings?.telegram_chat_id) {
      const url = `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage?chat_id=${settings.telegram_chat_id}&text=${encodeURIComponent(text)}&parse_mode=Markdown`;
      fetch(url).catch(console.error);
    }
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
    setShowSettings(false);
  };

  const handleAddItem = async (newItems) => {
    try {
      let itemName = '';
      let totalAdded = 0;
      let itemsToInsert = [];
      
      if (Array.isArray(newItems)) {
        itemsToInsert = newItems.map(item => ({ ...item, createdAt: new Date().toISOString() }));
        itemName = newItems[0].itemName;
        totalAdded = newItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
      } else {
        itemsToInsert = [{ ...newItems, createdAt: new Date().toISOString() }];
        itemName = newItems.itemName;
        totalAdded = newItems.quantity || 1;
      }

      if (!navigator.onLine) {
        addToOfflineQueue('ADD_ITEM', itemsToInsert);
        setItems(prev => [...itemsToInsert, ...prev]);
        logActivity('ADD (OFFLINE)', itemName, `נוסף במצב אופליין. יסונכרן בהמשך.`);
        alert("אין חיבור לאינטרנט! הפריט נשמר מקומית ויסונכרן אוטומטית כשתחזור הקליטה.");
        return;
      }

      const { error } = await supabase.from('items').insert(itemsToInsert);
      if (error) throw error;
      
      logActivity('ADD', itemName, `נוספו רשומות חדשות למלאי`);
      sendTelegramAlert(`✅ *פריט חדש למלאי:*\n*${itemName}*\n📦 כמות שנוספה: ${totalAdded}\n👤 בוצע ע"י: ${currentUser?.email || 'מנהל'}`);
      
    } catch(e) {
      if (e.message?.includes('Failed to fetch')) {
        alert("נראה שהחיבור ניתק. נא לנסות שוב.");
      } else {
        alert("שגיאה בשמירה לענן: " + e.message);
      }
    }
  };

  const handleUpdateItem = async (updatedItem) => {
    try {
      const oldItem = items.find(i => i.id === updatedItem.id);
      const oldQuantity = oldItem ? oldItem.quantity : 0;
      const newQuantity = updatedItem.quantity;
      const minQuantity = updatedItem.minQuantity || 0;

      if (!navigator.onLine) {
        addToOfflineQueue('UPDATE_ITEM', updatedItem);
        setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        logActivity('UPDATE (OFFLINE)', updatedItem.itemName, `עודכן באופליין.`);
        alert("אין אינטרנט! הפריט עודכן מקומית ויסונכרן בהמשך.");
        return;
      }
      
      const { error } = await supabase.from('items').update(updatedItem).eq('id', updatedItem.id);
      if (error) throw error;
      
      if (oldQuantity !== newQuantity) {
        logActivity('UPDATE', updatedItem.itemName, `עדכון כמות מ-${oldQuantity} ל-${newQuantity}`);
        
        // Calculate total quantity across all identical items
        const totalNow = items.filter(i => i.itemName === updatedItem.itemName).reduce((sum, i) => sum + (i.id === updatedItem.id ? newQuantity : i.quantity), 0);
        const totalBefore = items.filter(i => i.itemName === updatedItem.itemName).reduce((sum, i) => sum + i.quantity, 0);
        
        if (minQuantity > 0 && totalNow < minQuantity && totalBefore >= minQuantity) {
          sendTelegramAlert(`🚨 *התראת מלאי:* הפריט *${updatedItem.itemName}* ירד מתחת לכמות המינימום (${minQuantity}). \n\n📦 *כמות נוכחית:* ${totalNow}\n\nאנא הזמן מלאי חדש.`);
        }
      } else {
        logActivity('UPDATE', updatedItem.itemName, `עודכן פריט. אינוונטר: ${updatedItem.inventoryNumber}`);
      }
    } catch(e) {
      if (e.message?.includes('Failed to fetch')) {
        alert("נראה שהחיבור ניתק. נא לנסות שוב.");
      } else {
        alert("שגיאה בעדכון הפריט: " + e.message);
      }
    }
  };

  const handleDeleteItem = async (id) => {
    if (currentUser?.role !== 'admin') {
      alert('אין לך הרשאות למחוק פריטים.');
      return;
    }

    if (window.confirm("האם אתה בטוח שברצונך למחוק פריט זה?")) {
      try {
        const itemToDelete = items.find(i => i.id === id);

        if (!navigator.onLine) {
          addToOfflineQueue('DELETE_ITEM', id);
          setItems(prev => prev.filter(i => i.id !== id));
          if (itemToDelete) logActivity('DELETE (OFFLINE)', itemToDelete.itemName, `נמחק באופליין.`);
          alert("אין אינטרנט! הפריט נמחק מקומית ויסונכרן בהמשך.");
          return;
        }

        const { error } = await supabase.from('items').delete().eq('id', id);
        if (error) throw error;
        
        if (itemToDelete) {
           logActivity('DELETE', itemToDelete.itemName, `נמחק פריט. אינוונטר: ${itemToDelete.inventoryNumber}`);
           sendTelegramAlert(`🗑️ *פריט נמחק מהמלאי:*\n*${itemToDelete.itemName}*\n👤 בוצע ע"י: ${currentUser?.email || 'מנהל'}`);
        }
      } catch(e) { 
        if (e.message?.includes('Failed to fetch')) {
          alert("נראה שהחיבור ניתק. נא לנסות שוב.");
        } else {
          alert("שגיאה במחיקת הפריט: " + e.message); 
        }
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

  const handleSaveSettings = async (newSettings) => {
    try {
      const { error } = await supabase.from('settings').upsert({ id: 'default', ...newSettings });
      if (error) throw error;
      setSettings(newSettings);
    } catch(e) {
      throw e;
    }
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
      <div className="text-secondary text-sm mb-2" style={{ textAlign: 'right' }}>בס"ד</div>
      <header className="header animate-slide-in">
        <h1>
          <PackageSearch size={36} className="text-accent" />
          מערכת ניהול מלאי
        </h1>
        <div className="header-actions">
          {currentUser.role === 'admin' && (
            <>
              <button 
                onClick={() => { setShowLocationManagement(true); setShowUserManagement(false); setShowActivityLog(false); setShowSettings(false); }} 
                className={`btn ${showLocationManagement ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="ניהול מיקומים"
              >
                <MapPin size={20} />
                <span className="hide-on-mobile">מיקומים</span>
              </button>
              <button 
                onClick={() => { setShowUserManagement(true); setShowLocationManagement(false); setShowActivityLog(false); setShowSettings(false); }} 
                className={`btn ${showUserManagement ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="ניהול משתמשים"
              >
                <Users size={20} />
                <span className="hide-on-mobile">משתמשים</span>
              </button>
              <button 
                onClick={() => { setShowActivityLog(true); setShowLocationManagement(false); setShowUserManagement(false); setShowSettings(false); }} 
                className={`btn ${showActivityLog ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="יומן פעולות"
              >
                <Activity size={20} />
                <span className="hide-on-mobile">פעולות</span>
              </button>
              <button 
                onClick={() => { setShowSettings(true); setShowLocationManagement(false); setShowUserManagement(false); setShowActivityLog(false); }} 
                className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'} btn-icon`}
                title="הגדרות מערכת"
              >
                <SettingsIcon size={20} />
                <span className="hide-on-mobile">הגדרות</span>
              </button>
            </>
          )}
          {!showUserManagement && !showLocationManagement && !showActivityLog && !showSettings && (
            <>
              <button 
                onClick={() => { setAddModalPrefill(null); setIsAddModalOpen(true); }}
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
            onBack={() => setShowActivityLog(false)}
          />
        ) : showSettings && currentUser.role === 'admin' ? (
          <Settings 
            settings={settings}
            onSave={handleSaveSettings}
            onBack={() => setShowSettings(false)}
          />
        ) : (
          <>
            <Dashboard items={items} locations={locations} />
            <InventoryTable 
              items={items} 
              onDeleteItem={handleDeleteItem} 
              onUpdateItem={handleUpdateItem}
              onAddChild={(group) => {
                const overallTotals = {};
                items.forEach(i => {
                  if (i.itemName === group.itemName && i.minQuantity > 0) overallTotals.minQuantity = i.minQuantity;
                });
                setAddModalPrefill({
                  itemName: group.itemName,
                  location: group.location,
                  minQuantity: overallTotals.minQuantity || 0
                });
                setIsAddModalOpen(true);
              }}
              userRole={currentUser.role}
              locations={locations}
            />
            
            {/* Mobile Floating Action Button */}
            <button 
              className="fab-btn md:hidden"
              onClick={() => { setAddModalPrefill(null); setIsAddModalOpen(true); }}
              title="הוסף פריט"
            >
              <Plus size={28} />
            </button>

            {/* Modal for Add Item */}
            {isAddModalOpen && (
              <div className="modal-overlay" onClick={() => { setIsAddModalOpen(false); setAddModalPrefill(null); }}>
                <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={() => { setIsAddModalOpen(false); setAddModalPrefill(null); }}>
                    <X size={20} />
                  </button>
                  <InventoryForm 
                    initialValues={addModalPrefill}
                    onAddItem={(newItems) => {
                      handleAddItem(newItems);
                      setIsAddModalOpen(false); // Close automatically after success
                      setAddModalPrefill(null);
                    }} 
                    locations={locations} 
                    existingItems={items}
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
