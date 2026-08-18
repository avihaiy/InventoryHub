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
        let lastItemName = '';
        let lastLocation = '';

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          // Identify columns - being flexible with names
          let itemName = String(row['שם הפריט'] || row['שם'] || row['Item Name'] || row['ItemName'] || '').trim();
          let location = String(row['מיקום'] || row['Location'] || '').trim();
          
          const isChildRow = itemName.includes('↳ פירוט');
          
          if (isChildRow) {
            itemName = lastItemName;
            if (!location || location === '-') location = lastLocation;
          } else {
            lastItemName = itemName;
            lastLocation = location === 'מספר מיקומים' ? '' : location;
          }

          if (!itemName || !location) {
            skippedRows++;
            continue;
          }

          let inventoryNumber = String(row['אינוונטר'] || row['מספר אינוונטר'] || row['Inventory Number'] || '').trim();
          let serialNumber = String(row['סריאלי'] || row['מספר סריאלי'] || row['Serial Number'] || '').trim();
          let notes = String(row['הערות'] || row['Notes'] || '').trim();
          const quantity = parseInt(row['כמות'] || row['Quantity']) || 1;

          if (inventoryNumber === '-') inventoryNumber = '';
          if (serialNumber === '-') serialNumber = '';
          if (notes === '-') notes = '';

          // If this is a master row from a visual export, SKIP IT if the NEXT row is its child row
          if (!isChildRow) {
            const nextRow = jsonData[i + 1];
            if (nextRow) {
              const nextItemName = String(nextRow['שם הפריט'] || nextRow['שם'] || '').trim();
              if (nextItemName.includes('↳ פירוט')) {
                continue; // Skip master row to avoid duplicating quantities
              }
            }
          }

          importedItems.push({
            id: generateId(),
            itemName: itemName,
            location: location,
            inventoryNumber: inventoryNumber,
            serialNumber: serialNumber,
            quantity: quantity,
            minQuantity: 0,
            notes: notes,
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
