import React, { useState } from 'react';
import { Lock, User, KeyRound, LogIn } from 'lucide-react';

const Login = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Find user in the database
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('שם משתמש או סיסמה שגויים');
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card animate-slide-in">
        <div className="login-header">
          <div className="login-icon">
            <Lock size={32} />
          </div>
          <h2>התחברות למערכת</h2>
          <p>הכנס את פרטי הגישה שלך כדי להמשיך</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label htmlFor="email">דואר אלקטרוני</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הכנס דואר אלקטרוני"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">סיסמה</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="הכנס סיסמה"
                required
                dir="ltr"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            <LogIn size={20} />
            היכנס
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
