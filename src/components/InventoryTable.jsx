import React, { useState } from 'react';
import { Edit2, Trash2, Save, X, Search, ChevronDown, ChevronLeft, ChevronUp, BoxSelect, Plus, Minus } from 'lucide-react';

const InventoryTable = ({ items, onDeleteItem, onUpdateItem, onAddChild, userRole, locations = [] }) => {
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

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

  // Filter items based on search term and location
  const filteredItems = items.filter(item => {
    if (filterLocation && item.location !== filterLocation) return false;
    if (!searchTerm) return true;
    const term = String(searchTerm).toLowerCase();
    return (
      (item?.itemName && String(item.itemName).toLowerCase().includes(term)) ||
      (item?.inventoryNumber && String(item.inventoryNumber).toLowerCase().includes(term)) ||
      (item?.serialNumber && String(item.serialNumber).toLowerCase().includes(term)) ||
      (item?.location && String(item.location).toLowerCase().includes(term))
    );
  });

  // Calculate overall totals per item name for alerts
  const itemOverallTotals = {};
  if (items) {
    items.forEach(item => {
      if (!item || !item.itemName) return;
      if (!itemOverallTotals[item.itemName]) {
        itemOverallTotals[item.itemName] = { total: 0, minQuantity: 0 };
      }
      itemOverallTotals[item.itemName].total += parseInt(item.quantity) || 1;
      if (item.minQuantity > 0) {
        itemOverallTotals[item.itemName].minQuantity = item.minQuantity;
      }
    });
  }

  // Group items by itemName
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!item) return acc;
    const key = item.itemName || 'ללא שם';
    if (!acc[key]) {
      acc[key] = {
        id: key,
        itemName: item.itemName,
        locations: new Set(),
        totalQuantity: 0,
        items: []
      };
    }
    acc[key].totalQuantity += parseInt(item.quantity) || 1;
    if (item.location) acc[key].locations.add(item.location);
    acc[key].items.push(item);
    return acc;
  }, {});

  const groupArray = Object.values(groupedItems);

  return (
    <div className="card mt-4 animate-slide-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="card-title mb-0">רשימת מלאי ({filteredItems.length} מתוך {items.length} רשומות)</h2>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="custom-select w-full md:w-auto"
            style={{ padding: '0.6rem 1rem', paddingLeft: '2rem', minWidth: '150px' }}
          >
            <option value="">כל המיקומים</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
          
          <div className="search-container input-with-icon w-full md:w-auto">
            <input 
              type="text" 
              placeholder="חיפוש חופשי..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              style={{ width: '100%', minWidth: '200px' }}
            />
            <Search size={18} className="input-icon" />
          </div>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>שם הפריט</th>
              <th>מספר אינוונטר</th>
              <th>מספר סריאלי</th>
              <th>מיקום</th>
              <th>הערות</th>
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
                  <td style={{ fontWeight: 500 }}>
                    {group.locations.size > 1 ? 'מספר מיקומים' : (Array.from(group.locations)[0] || '-')}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>-</td>
                  <td>
                    {(() => {
                      const overall = itemOverallTotals[group.itemName] || { total: 0, minQuantity: 0 };
                      const isLow = overall.minQuantity > 0 && overall.total < overall.minQuantity;
                      return (
                        <div className="flex flex-col items-start">
                          <span className={`quantity-badge ${isLow ? 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500' : ''}`} title={isLow ? 'מלאי כולל נמוך מהמינימום' : ''}>
                            {group.totalQuantity}
                          </span>
                          {isLow && <span className="text-[10px] text-red-400 mt-1 font-semibold">מלאי נמוך!</span>}
                        </div>
                      );
                    })()}
                  </td>
                  {userRole === 'admin' && (
                    <td className="text-left" style={{ paddingLeft: '1rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAddChild && onAddChild(group); }} 
                        className="btn btn-secondary btn-sm"
                        title="הוסף פריט חדש לסוג זה"
                        style={{ padding: '4px 8px' }}
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                  )}
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
                            type="text" 
                            name="notes" 
                            value={editFormData.notes || ''} 
                            onChange={handleChange} 
                            className="edit-input" 
                            placeholder="הערות..."
                          />
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <input 
                              type="number" 
                              name="quantity" 
                              value={editFormData.quantity} 
                              onChange={handleChange} 
                              className="edit-input" 
                              min="1"
                              style={{ width: '60px' }}
                              title="כמות"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">התראה:</span>
                              <input 
                                type="number" 
                                name="minQuantity" 
                                value={editFormData.minQuantity || 0} 
                                onChange={handleChange} 
                                className="edit-input" 
                                min="0"
                                style={{ width: '40px', padding: '2px 4px', fontSize: '11px', height: '24px' }}
                                title="כמות מינימום להתראה"
                              />
                            </div>
                          </div>
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
                        <td>
                          <div className="text-secondary truncate" style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.notes || ''}>
                            {item.notes || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              {userRole === 'admin' && (
                                <button 
                                  onClick={() => item.quantity > 1 && onUpdateItem({...item, quantity: parseInt(item.quantity) - 1})}
                                  className="btn btn-icon text-gray-400 hover:text-white"
                                  style={{ padding: '2px', background: 'rgba(255,255,255,0.05)', minWidth: '24px', height: '24px' }}
                                  title="הפחת כמות"
                                >
                                  <Minus size={14} />
                                </button>
                              )}
                              <span className="font-semibold text-accent text-base">{item.quantity}</span>
                              {userRole === 'admin' && (
                                <button 
                                  onClick={() => onUpdateItem({...item, quantity: parseInt(item.quantity) + 1})}
                                  className="btn btn-icon text-gray-400 hover:text-white"
                                  style={{ padding: '2px', background: 'rgba(255,255,255,0.05)', minWidth: '24px', height: '24px' }}
                                  title="הוסף כמות"
                                >
                                  <Plus size={14} />
                                </button>
                              )}
                            </div>
                            {item.minQuantity > 0 && <span className="text-[10px] text-gray-500 mt-1">התראה מ-{item.minQuantity}</span>}
                          </div>
                        </td>
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
