import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, MessageCircle, Save, ArrowRight } from 'lucide-react';

const Settings = ({ settings, onSave, onBack }) => {
  const [phone, setPhone] = useState(settings?.whatsapp_phone || '');
  const [apikey, setApikey] = useState(settings?.whatsapp_apikey || '');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (settings) {
      setPhone(settings.whatsapp_phone || '');
      setApikey(settings.whatsapp_apikey || '');
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('שומר...');
    
    // Clean phone number (remove +, spaces, dashes)
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    
    try {
      await onSave({
        whatsapp_phone: cleanPhone,
        whatsapp_apikey: apikey
      });
      setStatus('נשמר בהצלחה!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('שגיאה בשמירה: ' + error.message);
    }
  };

  const handleTestMessage = async () => {
    if (!phone || !apikey) {
      alert("יש למלא מספר טלפון ומפתח API תחילה");
      return;
    }
    
    setStatus('שולח הודעת ניסיון...');
    const text = encodeURIComponent('🤖 הודעת בדיקה ממערכת ניהול המלאי שלך!');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=${apikey}`;
    
    try {
      // We use no-cors or just a simple fetch, but CallMeBot returns a simple text page.
      await fetch(url, { mode: 'no-cors' });
      setStatus('הודעת הניסיון נשלחה!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('שגיאה בשליחה.');
    }
  };

  return (
    <div className="card animate-slide-in">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="card-title" style={{ marginBottom: 0 }}>
          <SettingsIcon size={24} className="text-accent" />
          הגדרות מערכת
        </h2>
        <button onClick={onBack} className="btn btn-secondary btn-icon flex items-center gap-2">
          <span className="hide-on-mobile">חזור למערכת</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="mb-8 p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <MessageCircle size={20} className="text-accent" />
          התראות וואטסאפ אוטומטיות (מלאי חסר)
        </h3>
        <p className="text-secondary text-sm mb-4">
          לקבלת מפתח API חינמי, שלח הודעת וואטסאפ עם הטקסט: <strong>I allow callmebot to send me messages</strong> 
          למספר <strong>+34 644 49 53 08</strong>. <br/>
          הבוט יענה לך עם ה-API Key שלך.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>מספר טלפון (כולל קידומת בינלאומית, למשל 972501234567)</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="9725..."
              dir="ltr"
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>API Key (סיסמה מהבוט)</label>
            <input 
              type="text" 
              value={apikey} 
              onChange={e => setApikey(e.target.value)} 
              placeholder="123456"
              dir="ltr"
            />
          </div>
          
          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn btn-primary flex items-center gap-2 flex-1 justify-center">
              <Save size={18} /> שמור הגדרות
            </button>
            <button type="button" onClick={handleTestMessage} className="btn btn-secondary flex items-center gap-2">
              <MessageCircle size={18} /> בדיקה
            </button>
          </div>
          
          {status && <div className="text-sm mt-2 text-accent font-semibold text-center">{status}</div>}
        </form>
      </div>
    </div>
  );
};

export default Settings;
