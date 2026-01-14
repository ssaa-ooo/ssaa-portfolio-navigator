"use client";

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Rocket, Power } from 'lucide-react';

// プロトタイプ用のサンプルデータ
const rawData = [
  { id: 'P001', name: '次世代決済システム', ssV: 5, ssR: 4, ssC: 5, vvM: 4, vvS: 5, vvF: 4 },
  { id: 'P002', name: '社内SNSプロト', ssV: 5, ssR: 2, ssC: 3, vvM: 2, vvS: 2, vvF: 1 },
  { id: 'P003', name: '海外EC連携', ssV: 3, ssR: 3, ssC: 4, vvM: 5, vvS: 4, vvF: 3 },
  { id: 'P004', name: 'レガシー改修', ssV: 2, ssR: 2, ssC: 2, vvM: 1, vvS: 1, vvF: 1 },
];

const processedData = rawData.map(p => {
  const x = ((p.ssV * 0.4) + (p.ssR * 0.3) + (p.ssC * 0.3)) / 5 * 100;
  const y = ((p.vvM * 0.4) + (p.vvS * 0.4) + (p.vvF * 0.2)) / 5 * 100;
  let status = x > 60 && y > 60 ? "Star" : x > 60 ? "Pivot" : y > 60 ? "Risk" : "Stop";
  let color = status === "Star" ? "#3b82f6" : status === "Pivot" ? "#f59e0b" : status === "Risk" ? "#8b5cf6" : "#ef4444";
  return { ...p, x, y, status, color };
});

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">SSAA Portfolio Navigator</h1>
          <p className="text-slate-500 font-medium">Strategic Selection & Value Velocity Dashboard</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><Rocket className="text-blue-500" /> Selection Orbit Map</h2>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name="Sync" domain={[0, 100]} label={{ value: 'Strategic Sync (共感・戦略合致)', position: 'bottom', offset: 20 }} />
                  <YAxis type="number" dataKey="y" name="Velocity" domain={[0, 100]} label={{ value: 'Value Velocity (市場速度)', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <ZAxis type="number" range={[150, 150]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                  <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                  <Scatter name="Projects" data={processedData}>
                    {processedData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Power className="text-red-500" /> Decision Insight</h2>
            {processedData.map((project) => (
              <div key={project.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{project.name}</h3>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase bg-opacity-10" style={{ backgroundColor: project.color, color: project.color }}>{project.status}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase">
                    <span>Sync: {project.x.toFixed(0)}%</span>
                    <span>Velocity: {project.y.toFixed(0)}%</span>
                  </div>
                  <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${project.x}%` }} />
                    <div className="h-full bg-slate-200" style={{ width: '2px' }} />
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${project.y}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}