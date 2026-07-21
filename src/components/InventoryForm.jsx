import React, { useState } from 'react';
import { PackagePlus, Plus, Minus, Hash } from 'lucide-react';

const InventoryForm = ({ onAddItem, locations = [] }) => {
  const [itemName, setItemName] = useState('');
  const [location, setLocation] = useState('');
  const [identifiers, setIdentifiers] = useState([
    { inventoryNumber: '', serialNumber: '', quantity: 1 }
  ]);

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

    // Filter out rows where inventory number is empty
    const validIdentifiers = identifiers.filter(id => id.inventoryNumber.trim() !== '');
    
    if (validIdentifiers.length === 0) {
      alert('נא למלא לפחות מספר אינוונטר אחד');
      return;
    }

    const newItems = validIdentifiers.map(id => ({
      id: crypto.randomUUID(),
      itemName,
      location,
      inventoryNumber: id.inventoryNumber,
      serialNumber: id.serialNumber,
      quantity: id.quantity || 1,
      createdAt: new Date().toISOString()
    }));
    
    onAddItem(newItems);
    
    // Reset form
    setItemName('');
    setLocation('');
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
              placeholder="לדוגמה: מחשב נייד Dell"
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="location">מיקום</label>
            <input 
              type="text" 
              id="location" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="לדוגמה: ארון 4, מדף ב'"
              list="locations-list"
            />
            <datalist id="locations-list">
              {locations.map(loc => (
                <option key={loc.id} value={loc.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="identifiers-section mt-4">
          <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2">
            <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
              <Hash size={16} />
              מזהי פריטים (סך הכל: {identifiers.length})
            </h3>
            <button 
              type="button" 
              onClick={addIdentifierRow}
              className="btn btn-secondary btn-sm flex items-center gap-1"
            >
              <Plus size={16} />
              הוסף שורה
            </button>
          </div>

          <div className="identifiers-list flex flex-col gap-3 mt-4">
            {identifiers.map((identifier, index) => (
              <div key={index} className="identifier-row flex gap-3 items-end p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label>מספר אינוונטר</label>
                  <input 
                    type="text" 
                    value={identifier.inventoryNumber} 
                    onChange={(e) => handleIdentifierChange(index, 'inventoryNumber', e.target.value)} 
                    placeholder="לדוגמה: INV-001"
                    required
                  />
                </div>
                
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label>מספר סריאלי (אופציונלי)</label>
                  <input 
                    type="text" 
                    value={identifier.serialNumber} 
                    onChange={(e) => handleIdentifierChange(index, 'serialNumber', e.target.value)} 
                    placeholder="לדוגמה: SN-12345"
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0, width: '80px' }}>
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
                  className="btn btn-danger btn-icon"
                  disabled={identifiers.length === 1}
                  style={{ opacity: identifiers.length === 1 ? 0.5 : 1 }}
                  title="הסר שורה"
                >
                  <Minus size={18} />
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
    </div>
  );
};

export default InventoryForm;
