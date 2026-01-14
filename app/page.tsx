"use client";

import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Rocket, Power, RefreshCw, AlertCircle } from 'lucide-react';

// 型定義
interface ProjectData {
  id: string;
  name: string;
  x: number;
  y: number;
  status: string;
  color: string;
}

export default function Home() {
  const [data, setData] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. APIからデータを取得する関数
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('データの取得に失敗しました');
      const rawData = await response.json();

      // SSAAロジックでスコア計算
      const processed = rawData.map((p: any) => {
        const x = ((p.ssV * 0.4) + (p.ssR * 0.3) + (p.ssC * 0.3)) / 5 * 100;
        const y = ((p.vvM * 0.4) + (p.vvS * 0.4) + (p.vvF * 0.2)) / 5 * 100;
        
        let status = "Stop";
        let color = "#ef4444"; // red-500
        if (x > 60 && y > 60) { status = "Star"; color = "#3b82f6"; } // blue-500
        else if (x > 60) { status = "Pivot"; color = "#f59e0b"; } // amber-500
        else if (y > 60) { status = "Risk"; color = "#8b5cf6"; } // violet-500

        return { id: p.id, name: p.name, x, y, status, color };
      });

      setData(processed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">SSAA Portfolio Navigator</h1>
            <p className="text-slate-500 font-medium italic">Powered by Google Sheets Real-time Sync</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all text-sm font-bold text-slate-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Rocket className="text-blue-500" /> Selection Orbit Map
            </h2>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name="Sync" domain={[0, 100]} label={{ value: 'Strategic Sync', position: 'bottom', offset: 20 }} />
                  <YAxis type="number" dataKey="y" name="Velocity" domain={[0, 100]} label={{ value: 'Value Velocity', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <ZAxis type="number" range={[200, 200]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                  <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                  <Scatter name="Projects" data={data}>
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Decision List Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Power className="text-red-500" /> Decision Insight
            </h2>
            {data.map((project) => (
              <div key={project.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{project.name}</h3>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase bg-opacity-10" style={{ backgroundColor: project.color, color: project.color }}>{project.status}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-bold mb-2">
                  <span>Sync: {project.x.toFixed(0)}%</span>
                  <span>Velocity: {project.y.toFixed(0)}%</span>
                </div>
                <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${project.x}%` }} />
                  <div className="h-full bg-slate-200" style={{ width: '2px' }} />
                  <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${project.y}%` }} />
                </div>
              </div>
            ))}
            {data.length === 0 && !loading && (
              <p className="text-slate-400 text-center py-10">データがありません。スプレッドシートを確認してください。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}