import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { VitalRecord } from '../types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface VitalChartProps {
  data: VitalRecord[];
}

const VitalChart: React.FC<VitalChartProps> = ({ data }) => {
  // Sort data by time just in case
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  const formattedData = sortedData.map(d => ({
    ...d,
    time: format(new Date(d.timestamp), 'HH:mm'),
    fullDate: format(new Date(d.timestamp), 'd MMM, HH:mm')
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-xs">
          <p className="font-bold text-gray-700 mb-2">{payload[0].payload.fullDate}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-gray-500 capitalize">{p.name}:</span>
              <span className="font-mono font-medium text-gray-800">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Vital Trendler</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Line 
            type="monotone" 
            dataKey="systolic" 
            name="Sistolik T." 
            stroke="#e11d48" 
            strokeWidth={2}
            dot={{ r: 3, fill: '#e11d48' }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="diastolic" 
            name="Diyastolik T." 
            stroke="#fda4af" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="heartRate" 
            name="Nabız" 
            stroke="#0d9488" 
            strokeWidth={2}
            dot={{ r: 3, fill: '#0d9488' }}
          />
          <Line 
            type="monotone" 
            dataKey="temperature" 
            name="Ateş (°C)" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={{ r: 3, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;