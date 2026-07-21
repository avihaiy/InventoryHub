import React from 'react';
import { Trash2, BoxSelect } from 'lucide-react';

const InventoryTable = ({ items, onDeleteItem, userRole }) => {
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

  return (
    <div className="card mt-4 animate-slide-in" style={{ animationDelay: '0.1s' }}>
      <h2 className="card-title">רשימת מלאי ({items.length} פריטים)</h2>
      
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
            {items.map((item, index) => (
              <tr key={item.id} className="table-row-animate" style={{ animationDelay: `${index * 0.05}s` }}>
                <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.inventoryNumber}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {item.serialNumber || '-'}
                </td>
                <td>{item.location || '-'}</td>
                <td>{item.quantity}</td>
                {userRole === 'admin' && (
                  <td>
                    <button 
                      onClick={() => onDeleteItem(item.id)} 
                      className="btn btn-danger"
                      title="מחק פריט"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
