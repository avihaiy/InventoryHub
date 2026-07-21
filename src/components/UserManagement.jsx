import React, { useState } from 'react';
import { Users, UserPlus, Shield, Trash2, ArrowRight } from 'lucide-react';

const UserManagement = ({ users, onAddUser, onDeleteUser, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert('נא למלא דוא"ל וסיסמה');
      return;
    }
    
    // Check if user already exists
    if (users.some(u => u.email === formData.email)) {
      alert('משתמש זה כבר קיים במערכת');
      return;
    }

    onAddUser({
      id: crypto.randomUUID(),
      email: formData.email,
      password: formData.password,
      role: formData.role,
      createdAt: new Date().toISOString()
    });
    
    // Reset form
    setFormData({
      email: '',
      password: '',
      role: 'user'
    });
  };

  return (
    <div className="card animate-slide-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="card-title" style={{ marginBottom: 0 }}>
          <Users size={24} className="text-accent" />
          ניהול משתמשים והרשאות
        </h2>
        <button onClick={onBack} className="btn btn-secondary btn-icon flex items-center gap-2">
          חזור למערכת
          <ArrowRight size={18} />
        </button>
      </div>
      
      <div className="user-management-grid">
        <div className="add-user-section">
          <h3 className="section-subtitle">הוספת משתמש חדש</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">דואר אלקטרוני</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="לדוגמה: user@akko.muni.il"
                required 
                dir="ltr"
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="password">סיסמה</label>
              <input 
                type="text" 
                id="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="בחר סיסמה"
                required 
                dir="ltr"
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="role">הרשאה</label>
              <select 
                id="role" 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="custom-select"
              >
                <option value="user">משתמש רגיל (הוספה וצפייה)</option>
                <option value="admin">מנהל (הרשאות מלאות)</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <UserPlus size={18} />
              צור משתמש
            </button>
          </form>
        </div>

        <div className="users-list-section">
          <h3 className="section-subtitle">משתמשים קיימים ({users.length})</h3>
          <div className="users-list">
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <div className="user-email" dir="ltr">{user.email}</div>
                  <div className="user-role">
                    {user.role === 'admin' ? (
                      <span className="badge badge-admin"><Shield size={14} /> מנהל</span>
                    ) : (
                      <span className="badge badge-user">משתמש רגיל</span>
                    )}
                  </div>
                </div>
                {user.email !== 'avihai@akko.muni.il' && (
                  <button 
                    onClick={() => onDeleteUser(user.id)} 
                    className="btn btn-danger btn-sm"
                    title="מחק משתמש"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
