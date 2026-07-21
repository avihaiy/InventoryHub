import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportButton = ({ items }) => {
  const handleExport = () => {
    if (items.length === 0) {
      alert('אין נתונים לייצוא');
      return;
    }

    // Group items by itemName and location
    const groupedItems = items.reduce((acc, item) => {
      const key = `${item.itemName}::${item.location || ''}`;
      if (!acc[key]) {
        acc[key] = {
          itemName: item.itemName,
          location: item.location,
          totalQuantity: 0,
          items: []
        };
      }
      acc[key].totalQuantity += parseInt(item.quantity) || 1;
      acc[key].items.push(item);
      return acc;
    }, {});

    // Prepare data for Excel in a grouped visual layout
    const dataToExport = [];
    Object.values(groupedItems).forEach(group => {
      // Master group row
      dataToExport.push({
        'שם הפריט': group.itemName,
        'מספר אינוונטר': '-',
        'מספר סריאלי': '-',
        'מיקום': group.location || '',
        'כמות': group.totalQuantity,
        'תאריך הוספה': '-'
      });
      
      // Child detail rows
      group.items.forEach(item => {
        dataToExport.push({
          'שם הפריט': '  ↳ פירוט',
          'מספר אינוונטר': item.inventoryNumber,
          'מספר סריאלי': item.serialNumber || '-',
          'מיקום': '-',
          'כמות': item.quantity,
          'תאריך הוספה': new Date(item.createdAt).toLocaleDateString('he-IL')
        });
      });
    });

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Set column widths for better visibility
    const colWidths = [
      { wch: 25 }, // שם הפריט
      { wch: 20 }, // מס אינוונטר
      { wch: 20 }, // מס סריאלי
      { wch: 20 }, // מיקום
      { wch: 10 }, // כמות
      { wch: 15 }  // תאריך הוספה
    ];
    worksheet['!cols'] = colWidths;
    
    // Force RTL direction for the worksheet
    if(!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true, RTL: true });
    worksheet['!dir'] = 'rtl'; // Standard SheetJS flag for RTL

    const workbook = XLSX.utils.book_new();
    
    // Force RTL on workbook level as well
    workbook.Workbook = {
      Views: [{ RTL: true, rightToLeft: true }]
    };
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "דוח מלאי");

    // Generate Excel file and trigger download
    // Generate filename with current date
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    
    XLSX.writeFile(workbook, `Inventory_Report_${formattedDate}.xlsx`);
  };

  return (
    <button 
      onClick={handleExport} 
      className="btn btn-success"
      disabled={items.length === 0}
      style={{ opacity: items.length === 0 ? 0.5 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
    >
      <Download size={20} />
      ייצוא לאקסל
    </button>
  );
};

export default ExportButton;
