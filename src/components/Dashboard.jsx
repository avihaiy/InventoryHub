import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, Hash, MapPin } from 'lucide-react';

const Dashboard = ({ items, locations }) => {
  const stats = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + (parseInt(item?.quantity) || 1), 0);
    const uniqueRecords = items.length;
    const uniqueItemsTypes = new Set(items.map(i => i?.itemName || 'ללא שם')).size;

    // Group for chart
    const locationCounts = items.reduce((acc, item) => {
      if (!item) return acc;
      const loc = item.location || 'ללא מיקום';
      if (!acc[loc]) {
        acc[loc] = 0;
      }
      acc[loc] += (parseInt(item.quantity) || 1);
      return acc;
    }, {});

    const chartData = Object.keys(locationCounts).map(loc => ({
      name: loc,
      'יחידות': locationCounts[loc]
    })).sort((a, b) => b['יחידות'] - a['יחידות']);

    return { totalUnits, uniqueRecords, uniqueItemsTypes, chartData };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="dashboard-container mb-4">
      <div className="stats-grid mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <div className="stat-card card flex items-center gap-4 p-4">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1rem', borderRadius: '12px' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>סה"כ יחידות במלאי</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalUnits}</div>
          </div>
        </div>

        <div className="stat-card card flex items-center gap-4 p-4">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '12px' }}>
            <Hash size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>סוגי פריטים שונים</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.uniqueItemsTypes}</div>
          </div>
        </div>

        <div className="stat-card card flex items-center gap-4 p-4">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1rem', borderRadius: '12px' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>רשומות ייחודיות</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.uniqueRecords}</div>
          </div>
        </div>

      </div>

      <div className="chart-card card p-4">
        <h3 className="text-sm font-semibold text-secondary mb-4">פיזור מלאי לפי מיקומים</h3>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="יחידות" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
