import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, MessageCircle, Save, ArrowRight } from 'lucide-react';

const Settings = ({ settings, onSave, onBack }) => {
  const [telegramToken, setTelegramToken] = useState(settings?.telegram_bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(settings?.telegram_chat_id || '');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (settings) {
      setTelegramToken(settings.telegram_bot_token || '');
      setTelegramChatId(settings.telegram_chat_id || '');
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('שומר...');
    
    try {
      await onSave({
        telegram_bot_token: telegramToken.trim(),
        telegram_chat_id: telegramChatId.trim()
      });
      setStatus('נשמר בהצלחה!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('שגיאה בשמירה: ' + error.message);
    }
  };

  const handleTestMessage = async () => {
    if (!telegramToken || !telegramChatId) {
      alert("יש למלא את פרטי הטלגרם תחילה");
      return;
    }
    
    setStatus('שולח הודעת ניסיון...');
    const text = encodeURIComponent('🤖 *הודעת בדיקה* ממערכת ניהול המלאי שלך!');
    const url = `https://api.telegram.org/bot${telegramToken.trim()}/sendMessage?chat_id=${telegramChatId.trim()}&text=${text}&parse_mode=Markdown`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.ok) {
        setStatus('הודעת הניסיון נשלחה!');
      } else {
        setStatus('שגיאה: ' + data.description);
      }
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('שגיאה בשליחה למול שרתי טלגרם.');
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
          התראות טלגרם אוטומטיות (מלאי חסר)
        </h3>
        <p className="text-secondary text-sm mb-4">
          כדי לחבר את המערכת לטלגרם, עליך לבצע שני שלבים פשוטים בטלגרם שלך: <br/>
          1. חפש את הבוט <strong>@BotFather</strong>, שלח לו את הפקודה <code>/newbot</code> וצור בוט. הוא ייתן לך <strong>API Token</strong>. <br/>
          2. חפש את הבוט <strong>@userinfobot</strong> ושלח לו הודעה, הוא יחזיר לך את מספר ה-<strong>Chat ID</strong> האישי שלך.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Bot API Token (מ-BotFather)</label>
            <input 
              type="text" 
              value={telegramToken} 
              onChange={e => setTelegramToken(e.target.value)} 
              placeholder="123456789:ABCdefGHIjklMNO..."
              dir="ltr"
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>ה-Chat ID שלך (מ-userinfobot)</label>
            <input 
              type="text" 
              value={telegramChatId} 
              onChange={e => setTelegramChatId(e.target.value)} 
              placeholder="12345678"
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
