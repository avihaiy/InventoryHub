import React, { useState, useEffect, useMemo } from 'react';
import { PackagePlus, Plus, Minus, Hash, Scan } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const InventoryForm = ({ onAddItem, locations = [], initialValues = null, existingItems = [] }) => {
  const [itemName, setItemName] = useState(initialValues?.itemName || '');
  const [location, setLocation] = useState(initialValues?.location || '');
  const [minQuantity, setMinQuantity] = useState(initialValues?.minQuantity || 0);
  const [identifiers, setIdentifiers] = useState([
    { inventoryNumber: '', serialNumber: '', quantity: 1 }
  ]);
  const [scannerTarget, setScannerTarget] = useState(null);

  // Auto-fill location and minQuantity when selecting an existing item name
  useEffect(() => {
    if (itemName && existingItems && existingItems.length > 0) {
      const existing = existingItems.find(i => i.itemName === itemName);
      if (existing) {
        if (!location && existing.location) setLocation(existing.location);
        if (!minQuantity && existing.minQuantity > 0) setMinQuantity(existing.minQuantity);
      }
    }
  }, [itemName]);

  // Extract unique item names for autocomplete
  const uniqueItemNames = useMemo(() => {
    if (!existingItems) return [];
    return [...new Set(existingItems.map(i => i.itemName).filter(Boolean))];
  }, [existingItems]);

  const handleScan = (decodedText) => {
    if (scannerTarget) {
      handleIdentifierChange(scannerTarget.index, scannerTarget.field, decodedText);
    }
  };

  const handleIdentifierChange = (index, field, value) => {
    const newIdentifiers = [...identifiers];
    if (field === 'quantity') {
      newIdentifiers[index][field] = parseInt(value) || 1;
    } else {
      newIdentifiers[index][field] = value;
    }
    setIdentifiers(newIdentifiers);
  };

  const addIdentifierRow = () => {
    setIdentifiers([...identifiers, { inventoryNumber: '', serialNumber: '', quantity: 1 }]);
  };

  const removeIdentifierRow = (index) => {
    if (identifiers.length > 1) {
      const newIdentifiers = identifiers.filter((_, i) => i !== index);
      setIdentifiers(newIdentifiers);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName) {
      alert('נא למלא שם פריט');
      return;
    }

    // We allow items without inventory numbers now
    const validIdentifiers = identifiers.filter(id => id.inventoryNumber.trim() !== '' || id.serialNumber.trim() !== '' || id.quantity > 0);
    
    if (validIdentifiers.length === 0) {
      alert('נא להזין נתונים תקינים');
      return;
    }

    const newItems = validIdentifiers.map(id => ({
      id: generateId(),
      itemName,
      location,
      inventoryNumber: id.inventoryNumber,
      serialNumber: id.serialNumber,
      quantity: id.quantity || 1,
      minQuantity: parseInt(minQuantity) || 0,
      createdAt: new Date().toISOString()
    }));
    
    onAddItem(newItems);
    
    // Reset form
    setItemName('');
    setLocation('');
    setMinQuantity(0);
    setIdentifiers([{ inventoryNumber: '', serialNumber: '', quantity: 1 }]);
  };

  const totalQuantity = identifiers.reduce((sum, id) => sum + (parseInt(id.quantity) || 1), 0);

  return (
    <div className="card animate-slide-in">
      <h2 className="card-title">
        <PackagePlus size={24} className="text-accent" />
        הוספת פריטים למלאי
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid mb-4">
          <div className="input-group">
            <label htmlFor="itemName">שם הפריט (כללי)</label>
            <input 
              type="text" 
              id="itemName" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder="לדוגמה: מחשב נייד DELL"
              required
              list="existing-item-names"
              autoComplete="off"
            />
            <datalist id="existing-item-names">
              {uniqueItemNames.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          
          <div className="input-group">
            <label htmlFor="location">מיקום</label>
            <select 
              id="location" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              className="custom-select"
              required
            >
              <option value="" disabled>בחר מיקום...</option>
              {locations.length === 0 && <option value="" disabled>לא הוגדרו מיקומים במערכת</option>}
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="minQuantity">כמות התראה מינימלית (וואטסאפ)</label>
            <input 
              type="number" 
              id="minQuantity" 
              value={minQuantity} 
              onChange={(e) => setMinQuantity(e.target.value)} 
              placeholder="0 (ללא התראה)"
              min="0"
            />
          </div>
        </div>

        <div className="identifiers-section mt-4">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 mb-2 border-b border-gray-700 pb-2">
            <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
              <Hash size={16} />
              מזהי פריטים (סך הכל: {identifiers.length})
            </h3>
            <button 
              type="button" 
              onClick={addIdentifierRow}
              className="btn btn-secondary btn-sm w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              הוסף שורה
            </button>
          </div>

          <div className="identifiers-list flex flex-col gap-3 mt-4">
            {identifiers.map((identifier, index) => (
              <div key={index} className="identifier-row flex flex-col md:flex-row gap-3 md:items-end p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <div className="input-group w-full" style={{ marginBottom: 0, flex: 1 }}>
                  <label>מספר אינוונטר</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={identifier.inventoryNumber} 
                      onChange={(e) => handleIdentifierChange(index, 'inventoryNumber', e.target.value)} 
                      placeholder="לא חובה (INV-001)"
                      className="w-full"
                    />
                    <button 
                      type="button" 
                      onClick={() => setScannerTarget({ index, field: 'inventoryNumber' })}
                      className="btn btn-secondary btn-icon"
                      title="סרוק ברקוד"
                    >
                      <Scan size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="input-group w-full" style={{ marginBottom: 0, flex: 1 }}>
                  <label>סריאלי (אופציונלי)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={identifier.serialNumber} 
                      onChange={(e) => handleIdentifierChange(index, 'serialNumber', e.target.value)} 
                      placeholder="SN-12345"
                      className="w-full"
                    />
                    <button 
                      type="button" 
                      onClick={() => setScannerTarget({ index, field: 'serialNumber' })}
                      className="btn btn-secondary btn-icon"
                      title="סרוק ברקוד"
                    >
                      <Scan size={18} />
                    </button>
                  </div>
                </div>

                <div className="input-group w-full md:w-80px" style={{ marginBottom: 0 }}>
                  <label>כמות</label>
                  <input 
                    type="number" 
                    min="1"
                    value={identifier.quantity} 
                    onChange={(e) => handleIdentifierChange(index, 'quantity', e.target.value)} 
                    required
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => removeIdentifierRow(index)}
                  className="btn btn-danger btn-icon w-full md:w-auto mt-2 md:mt-0"
                  disabled={identifiers.length === 1}
                  style={{ opacity: identifiers.length === 1 ? 0.5 : 1 }}
                  title="הסר שורה"
                >
                  <Minus size={18} />
                  <span className="md:hidden">הסר מזהה זה</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions mt-8">
          <button type="submit" className="btn btn-primary w-full md:w-auto">
            <PackagePlus size={20} />
            הוסף {totalQuantity} פריט/ים למלאי
          </button>
        </div>
      </form>
      
      {scannerTarget && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setScannerTarget(null)} 
        />
      )}
    </div>
  );
};

export default InventoryForm;
