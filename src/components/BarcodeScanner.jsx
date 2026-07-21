import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onScan, onClose }) => {
  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      false
    );

    scanner.render(
      (decodedText) => {
        // Stop scanning and return value
        scanner.clear();
        onScan(decodedText);
        onClose();
      },
      (error) => {
        // Ignore errors (happens constantly while scanning)
      }
    );

    // Cleanup function
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan, onClose]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.85)', 
      zIndex: 9999, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        backgroundColor: '#fff', 
        padding: '1rem', 
        borderRadius: '12px' 
      }}>
        <h3 style={{ color: '#000', textAlign: 'center', marginBottom: '1rem', fontWeight: 600 }}>סרוק ברקוד או QR</h3>
        <div id="reader" style={{ width: '100%' }}></div>
        <button 
          onClick={onClose} 
          className="btn btn-secondary w-full mt-4" 
          style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
