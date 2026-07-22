import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet } from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const ExcelImport = ({ onImport, disabled }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Map columns
        const importedItems = [];
        let skippedRows = 0;

        for (const row of jsonData) {
          // Identify columns - being flexible with names
          const itemName = row['שם הפריט'] || row['שם'] || row['Item Name'] || row['ItemName'] || '';
          const location = row['מיקום'] || row['Location'] || '';
          
          if (!itemName || !location) {
            skippedRows++;
            continue;
          }

          const inventoryNumber = row['אינוונטר'] || row['מספר אינוונטר'] || row['Inventory Number'] || '';
          const serialNumber = row['סריאלי'] || row['מספר סריאלי'] || row['Serial Number'] || '';
          const quantity = parseInt(row['כמות'] || row['Quantity']) || 1;
          const notes = row['הערות'] || row['Notes'] || '';

          importedItems.push({
            id: generateId(),
            itemName: String(itemName).trim(),
            location: String(location).trim(),
            inventoryNumber: String(inventoryNumber).trim(),
            serialNumber: String(serialNumber).trim(),
            quantity: quantity,
            minQuantity: 0,
            notes: String(notes).trim(),
            createdAt: new Date().toISOString()
          });
        }

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        if (importedItems.length > 0) {
          const msg = `נמצאו ${importedItems.length} פריטים תקינים בקובץ.\n${skippedRows > 0 ? `(${skippedRows} שורות דולגו עקב חוסר בשם פריט או מיקום)` : ''}\n\nהאם לייבא אותם למערכת?`;
          if (window.confirm(msg)) {
            onImport(importedItems);
          }
        } else {
          alert('לא נמצאו פריטים תקינים בקובץ. ודא שיש עמודות "שם הפריט" ו"מיקום".');
        }
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        alert('שגיאה בקריאת קובץ האקסל. אנא ודא שהקובץ תקין.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="btn btn-secondary btn-icon"
        disabled={disabled}
        title="ייבוא מאקסל"
      >
        <FileSpreadsheet size={20} />
        <span className="hide-on-mobile">ייבוא מאקסל</span>
      </button>
    </>
  );
};

export default ExcelImport;
