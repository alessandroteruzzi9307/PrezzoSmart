import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { Offer } from '../types';

interface PriceChartProps {
  offers: Offer[];
  averagePrice: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ offers, averagePrice }) => {
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  const getBarColor = (price: number, minPrice: number) => {
    if (price === minPrice) return '#10B981'; // Emerald 500
    if (price > averagePrice) return '#F43F5E'; // Rose 500
    return '#6366F1'; // Indigo 500
  };

  const minPrice = sortedOffers.length > 0 ? sortedOffers[0].price : 0;

  return (
    <div className="w-full h-[380px] bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
        Analisi Prezzi
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={sortedOffers}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis 
            dataKey="store" 
            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false}
            tickMargin={10}
            interval={0} // Force show all if possible
          />
          <YAxis 
            unit="€" 
            tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: '#F8FAFC' }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              padding: '12px 16px',
              fontFamily: 'inherit'
            }}
          />
          <ReferenceLine y={averagePrice} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Media', position: 'insideRight', fill: '#F59E0B', fontSize: 10, fontWeight: 700 }} />
          <Bar dataKey="price" radius={[6, 6, 6, 6]} barSize={40}>
            {sortedOffers.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.price, minPrice)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;