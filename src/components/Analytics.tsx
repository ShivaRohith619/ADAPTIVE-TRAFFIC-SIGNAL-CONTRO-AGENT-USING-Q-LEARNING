
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SimulationStats } from '../simulation/types';

interface AnalyticsProps {
  history: { episode: number; reward: number; waitTime: number }[];
  stats: SimulationStats;
}

const Analytics: React.FC<AnalyticsProps> = ({ history, stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Avg Wait Time</p>
          <p className="text-2xl font-mono text-emerald-400">{stats.averageWaitTime.toFixed(2)}s</p>
        </div>
        <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Vehicles Passed</p>
          <p className="text-2xl font-mono text-blue-400">{stats.totalVehiclesPassed}</p>
        </div>
      </div>

      <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 h-64">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Reward vs Episodes</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="episode" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Line type="monotone" dataKey="reward" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 h-64">
        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-4">Wait Time Trend</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="episode" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              itemStyle={{ color: '#3b82f6' }}
            />
            <Line type="monotone" dataKey="waitTime" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
