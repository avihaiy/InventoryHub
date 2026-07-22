import React from 'react';
import { Activity, Plus, Edit2, Trash2, Clock, LogIn } from 'lucide-react';

const ActionIcon = ({ action }) => {
  switch (action) {
    case 'ADD':
      return <div className="p-2 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Plus size={16} /></div>;
    case 'UPDATE':
      return <div className="p-2 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Edit2 size={16} /></div>;
    case 'DELETE':
      return <div className="p-2 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><Trash2 size={16} /></div>;
    case 'LOGIN':
      return <div className="p-2 rounded-full" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}><LogIn size={16} /></div>;
    default:
      return <div className="p-2 rounded-full" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' }}><Activity size={16} /></div>;
  }
};

const ActionText = ({ action }) => {
  switch (action) {
    case 'ADD': return <span style={{ color: '#10b981', fontWeight: 600 }}>הוסיף/ה</span>;
    case 'UPDATE': return <span style={{ color: '#3b82f6', fontWeight: 600 }}>עדכן/ה</span>;
    case 'DELETE': return <span style={{ color: '#ef4444', fontWeight: 600 }}>מחק/ה</span>;
    case 'LOGIN': return <span style={{ color: '#a855f7', fontWeight: 600 }}>התחבר/ה למערכת</span>;
    default: return <span>ביצע/ה פעולה</span>;
  }
};

const ActivityLog = ({ logs, onClear }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="card mt-4 animate-slide-in">
        <h2 className="card-title"><Activity size={24} className="text-accent" /> יומן פעולות</h2>
        <div className="empty-state">
          <Clock size={48} />
          <h3>אין עדיין היסטוריית פעולות</h3>
          <p>פעולות שיתבצעו במערכת יתועדו כאן.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-4 animate-slide-in">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="card-title mb-0"><Activity size={24} className="text-accent" /> יומן פעולות ({logs.length})</h2>
        {onClear && (
          <button onClick={onClear} className="btn btn-secondary btn-sm flex items-center gap-2">
            <Trash2 size={16} /> <span className="hide-on-mobile">נקה יומן</span>
          </button>
        )}
      </div>

      <div className="log-container" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
              <ActionIcon action={log.action} />
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div style={{ fontSize: '0.95rem' }}>
                    <strong>{log.user}</strong> <ActionText action={log.action} /> 
                    {log.action !== 'LOGIN' && (
                      <span> את הפריט <strong>{log.itemName}</strong></span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.timestamp).toLocaleString('he-IL')}
                  </div>
                </div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {log.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
