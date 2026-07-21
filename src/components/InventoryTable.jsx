import React, { useState } from 'react';
import { Trash2, BoxSelect, Edit2, Save, X, ChevronDown, ChevronLeft } from 'lucide-react';

const InventoryTable = ({ items, onDeleteItem, onUpdateItem, userRole, locations = [] }) => {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  const handleEditClick = (item, e) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditFormData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = () => {
    if (!editFormData.itemName || !editFormData.inventoryNumber || !editFormData.location) {
      alert('נא למלא את כל שדות החובה (שם, אינוונטר, מיקום)');
      return;
    }
    onUpdateItem(editFormData);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  if (!items || items.length === 0) {
    return (
      <div className="card mt-4 animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <div className="empty-state">
          <BoxSelect size={48} />
          <h3>המלאי ריק כרגע</h3>
          <p>הוסף פריטים למעלה כדי לראות אותם כאן בטבלה.</p>
        </div>
      </div>
    );
  }

  // Group items by itemName and location
  const groupedItems = items.reduce((acc, item) => {
    const key = `${item.itemName}::${item.location || ''}`;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        itemName: item.itemName,
        location: item.location,
        totalQuantity: 0,
        items: []
      };
    }
    acc[key].totalQuantity += parseInt(item.quantity) || 1;
    acc[key].items.push(item);
    return acc;
  }, {});

  const groupArray = Object.values(groupedItems);

  return (
    <div className="card mt-4 animate-slide-in" style={{ animationDelay: '0.1s' }}>
      <h2 className="card-title">רשימת מלאי ({items.length} רשומות ייחודיות)</h2>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>שם הפריט</th>
              <th>מספר אינוונטר</th>
              <th>מספר סריאלי</th>
              <th>מיקום</th>
              <th>כמות</th>
              {userRole === 'admin' && <th>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {groupArray.map((group, groupIndex) => (
              <React.Fragment key={group.id}>
                {/* Master Group Row */}
                <tr 
                  className="group-row" 
                  onClick={() => toggleGroup(group.id)} 
                  style={{ animationDelay: `${groupIndex * 0.05}s` }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>
                    <div className="flex items-center gap-2">
                      {expandedGroups[group.id] ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
                      {group.itemName}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>-</td>
                  <td style={{ color: 'var(--text-secondary)' }}>-</td>
                  <td style={{ fontWeight: 500 }}>{group.location || '-'}</td>
                  <td>
                    <span className="quantity-badge">{group.totalQuantity}</span>
                  </td>
                  {userRole === 'admin' && <td></td>}
                </tr>

                {/* Expanded Child Rows */}
                {expandedGroups[group.id] && group.items.map((item, itemIndex) => (
                  <tr key={item.id} className="child-row">
                    {editingId === item.id ? (
                      <>
                        <td style={{ paddingRight: '2.5rem' }}>
                          <input 
                            type="text" 
                            name="itemName" 
                            value={editFormData.itemName} 
                            onChange={handleChange} 
                            className="edit-input" 
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            name="inventoryNumber" 
                            value={editFormData.inventoryNumber} 
                            onChange={handleChange} 
                            className="edit-input" 
                            dir="ltr"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            name="serialNumber" 
                            value={editFormData.serialNumber || ''} 
                            onChange={handleChange} 
                            className="edit-input" 
                            dir="ltr"
                          />
                        </td>
                        <td>
                          <select 
                            name="location" 
                            value={editFormData.location} 
                            onChange={handleChange} 
                            className="edit-input custom-select-small"
                          >
                            <option value="" disabled>בחר...</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.name}>{loc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number" 
                            name="quantity" 
                            value={editFormData.quantity} 
                            onChange={handleChange} 
                            className="edit-input" 
                            min="1"
                            style={{ width: '60px' }}
                          />
                        </td>
                        <td className="flex gap-2">
                          <button 
                            onClick={handleSaveEdit} 
                            className="btn btn-success btn-sm"
                            title="שמור"
                          >
                            <Save size={16} />
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            className="btn btn-secondary btn-sm"
                            title="ביטול"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ paddingRight: '2.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                          ↳ פירוט
                        </td>
                        <td style={{ fontFamily: 'monospace' }}>{item.inventoryNumber}</td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {item.serialNumber || '-'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        <td>{item.quantity}</td>
                        {userRole === 'admin' && (
                          <td className="flex gap-2">
                            <button 
                              onClick={(e) => handleEditClick(item, e)} 
                              className="btn btn-primary btn-sm"
                              title="ערוך פריט"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => onDeleteItem(item.id)} 
                              className="btn btn-danger btn-sm"
                              title="מחק פריט"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
