import React from 'react';
import { PackagePlus } from 'lucide-react';

const InventoryForm = ({ onAddItem }) => {
  const [formData, setFormData] = React.useState({
    itemName: '',
    inventoryNumber: '',
    serialNumber: '',
    location: '',
    quantity: 1
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.inventoryNumber) {
      alert('נא למלא לפחות שם פריט ומספר אינוונטר');
      return;
    }
    
    onAddItem({
      ...formData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    });
    
    // Reset form
    setFormData({
      itemName: '',
      inventoryNumber: '',
      serialNumber: '',
      location: '',
      quantity: 1
    });
  };

  return (
    <div className="card animate-slide-in">
      <h2 className="card-title">
        <PackagePlus size={24} className="text-accent" />
        הוספת פריט חדש
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="itemName">שם הפריט</label>
            <input 
              type="text" 
              id="itemName" 
              name="itemName" 
              value={formData.itemName} 
              onChange={handleChange} 
              placeholder="לדוגמה: מחשב נייד Dell"
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="inventoryNumber">מספר אינוונטר</label>
            <input 
              type="text" 
              id="inventoryNumber" 
              name="inventoryNumber" 
              value={formData.inventoryNumber} 
              onChange={handleChange} 
              placeholder="לדוגמה: INV-001"
              required 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="serialNumber">מספר סריאלי</label>
            <input 
              type="text" 
              id="serialNumber" 
              name="serialNumber" 
              value={formData.serialNumber} 
              onChange={handleChange} 
              placeholder="לדוגמה: SN-987654321" 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="location">מיקום</label>
            <input 
              type="text" 
              id="location" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="לדוגמה: ארון 4, מדף ב'" 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="quantity">כמות</label>
            <input 
              type="number" 
              id="quantity" 
              name="quantity" 
              min="1" 
              value={formData.quantity} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <PackagePlus size={20} />
            הוסף למלאי
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm;
