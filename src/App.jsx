import React, { useState, useEffect } from 'react';
import { PackageSearch, LogOut } from 'lucide-react';
import InventoryForm from './components/InventoryForm';
import InventoryTable from './components/InventoryTable';
import ExportButton from './components/ExportButton';
import Login from './components/Login';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [items, setItems] = useState(() => {
    // Load from local storage on initial render
    const saved = localStorage.getItem('inventoryData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse inventory data', e);
        return [];
      }
    }
    return [];
  });

  // Save to local storage whenever items change
  useEffect(() => {
    localStorage.setItem('inventoryData', JSON.stringify(items));
  }, [items]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  const handleAddItem = (newItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="header animate-slide-in">
        <h1>
          <PackageSearch size={36} className="text-accent" />
          מערכת ניהול מלאי
        </h1>
        <div className="header-actions">
          <ExportButton items={items} />
          <button onClick={handleLogout} className="btn btn-danger btn-icon">
            <LogOut size={20} />
            התנתק
          </button>
        </div>
      </header>
      
      <main>
        <InventoryForm onAddItem={handleAddItem} />
        <InventoryTable items={items} onDeleteItem={handleDeleteItem} />
      </main>
    </div>
  );
}

export default App;
