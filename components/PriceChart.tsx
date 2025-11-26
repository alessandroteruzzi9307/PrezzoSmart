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
  // Sort offers by price for better visualization
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  const getBarColor = (price: number, minPrice: number) => {
    if (price === minPrice) return '#10B981'; // Emerald 500
    if (price > averagePrice) return '#F43F5E'; // Rose 500
    return '#6366F1'; // Indigo 500
  };

  const minPrice = sortedOffers.length > 0 ? sortedOffers[0].price : 0;

  return (
    <div className="w-full h-[350px] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Analisi Prezzi</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedOffers}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="store" 
            tick={{ fill: '#64748B', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
          />
          <YAxis 
            unit="€" 
            tick={{ fill: '#64748B', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip 
            cursor={{ fill: '#F1F5F9' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <ReferenceLine y={averagePrice} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Media', position: 'right', fill: '#F59E0B', fontSize: 12 }} />
          <Bar dataKey="price" radius={[4, 4, 0, 0]}>
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