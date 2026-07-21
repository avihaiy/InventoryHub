import React, { useState } from 'react';
import { MapPin, Plus, Trash2, ArrowRight } from 'lucide-react';

const LocationManagement = ({ locations, onAddLocation, onDeleteLocation, onBack }) => {
  const [locationName, setLocationName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!locationName.trim()) {
      alert('נא להזין שם מיקום');
      return;
    }
    
    // Check if location already exists
    if (locations.some(l => l.name === locationName.trim())) {
      alert('מיקום זה כבר קיים במערכת');
      return;
    }

    onAddLocation({
      id: crypto.randomUUID(),
      name: locationName.trim(),
      createdAt: new Date().toISOString()
    });
    
    setLocationName('');
  };

  return (
    <div className="card animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="card-title" style={{ marginBottom: 0 }}>
          <MapPin size={24} className="text-accent" />
          ניהול מיקומים
        </h2>
        <button onClick={onBack} className="btn btn-secondary btn-icon flex items-center gap-2">
          חזור למערכת
          <ArrowRight size={18} />
        </button>
      </div>
      
      <div className="user-management-grid">
        <div className="add-user-section">
          <h3 className="section-subtitle">הוספת מיקום חדש</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="locationName">שם המיקום</label>
              <input 
                type="text" 
                id="locationName" 
                value={locationName} 
                onChange={(e) => setLocationName(e.target.value)} 
                placeholder="לדוגמה: w-02 ארון חדר יוסי"
                required 
              />
              <small className="text-secondary" style={{ marginTop: '0.25rem' }}>
                מיקום זה יופיע כאפשרות בחירה מהירה בעת הוספת פריטים למלאי.
              </small>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <Plus size={18} />
              הוסף מיקום
            </button>
          </form>
        </div>

        <div className="users-list-section">
          <h3 className="section-subtitle">מיקומים מוגדרים ({locations.length})</h3>
          <div className="users-list">
            {locations.length === 0 ? (
              <div className="text-secondary" style={{ textAlign: 'center', padding: '1rem' }}>
                לא הוגדרו מיקומים במערכת.
              </div>
            ) : (
              locations.map((loc) => (
                <div key={loc.id} className="user-item">
                  <div className="user-info">
                    <div className="user-email" style={{ fontWeight: 500 }}>
                      <MapPin size={14} style={{ display: 'inline', marginLeft: '0.5rem', color: 'var(--text-secondary)' }} />
                      {loc.name}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`האם אתה בטוח שברצונך למחוק את המיקום "${loc.name}"?`)) {
                        onDeleteLocation(loc.id);
                      }
                    }} 
                    className="btn btn-danger btn-sm"
                    title="מחק מיקום"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;
