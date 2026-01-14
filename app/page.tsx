'use client';

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { Settings2, RefreshCw, Save, X, ChevronRight, Info } from 'lucide-react';

export default function SSAANavigator() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempScores, setTempScores] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      const processed = json.map((p: any) => ({
        ...p,
        x: ((p.ssV * 0.4) + (p.ssR * 0.3) + (p.ssC * 0.3)) * 20,
        y: ((p.vvM * 0.4) + (p.vvS * 0.4) + (p.vvF * 0.2)) * 20,
      }));
      setData(processed);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const startEditing = (project: any) => {
    setEditingId(project.id);
    setTempScores({
      ssV: project.ssV, ssR: project.ssR, ssC: project.ssC,
      vvM: project.vvM, vvS: project.vvS, vvF: project.vvF
    });
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: {
            'SS_Vision': tempScores.ssV,
            'SS_Resonance': tempScores.ssR,
            'SS_Context': tempScores.ssC,
            'VV_Market': tempScores.vvM,
            'VV_Speed': tempScores.vvS,
            'VV_Friction': tempScores.vvF,
          }
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setEditingId(null);
      await fetchData(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSlider = (label: string, key: string) => (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-500 font-bold uppercase">{label}</span>
        <span className="text-blue-600 font-black">{tempScores[key]} / 5</span>
      </div>
      <input
        type="range" min="1" max="5" step="1"
        value={tempScores[key]}
        onChange={(e) => setTempScores({ ...tempScores, [key]: parseInt(e.target.value) })}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );

  if (error) return <div className="p-8 text-red-500 font-bold">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">SSAA Portfolio Navigator</h1>
          <p className="text-slate-500 font-medium italic">Interactive Decision Support System</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-bold text-sm">Sync Now</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Settings2 className="w-5 h-5 text-blue-600" /></div>
              <h2 className="text-xl font-bold text-slate-800">Selection Orbit Map</h2>
            </div>
          </div>
          <div className="h-[500px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="x" name="Strategic Sync" domain={[0, 100]} label={{ value: 'Strategic Sync (%)', position: 'bottom', offset: 20 }} />
                <YAxis type="number" dataKey="y" name="Value Velocity" domain={[0, 100]} label={{ value: 'Value Velocity (%)', angle: -90, position: 'left', offset: 0 }} />
                <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border rounded-2xl shadow-2xl border-slate-100">
                        <p className="font-black text-slate-800 border-b pb-2 mb-2">{p.name}</p>
                        <p className="text-xs font-bold text-blue-600">Sync: {p.x}%</p>
                        <p className="text-xs font-bold text-green-600">Velocity: {p.y}%</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Scatter name="Projects" data={data}>
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.x >= 60 && entry.y >= 60 ? '#2563eb' : entry.x < 60 && entry.y < 60 ? '#f43f5e' : '#f59e0b'} 
                      strokeWidth={editingId === entry.id ? 4 : 0}
                      stroke="#2563eb"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <Info className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Project Intelligence</h2>
          </div>
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
            {data.map((p) => (
              <div key={p.id} className={`p-5 rounded-3xl border transition-all ${editingId === p.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">{p.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 border px-2 py-0.5 rounded uppercase">{p.id}</span>
                  </div>
                  {editingId !== p.id ? (
                    <button onClick={() => startEditing(p)} className="p-2 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                      <Settings2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(p.id)} disabled={isSaving} className="p-2.5 bg-blue-600 text-white rounded-2xl">
                        <Save className="w-5 h-5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-2xl">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === p.id ? (
                  <div className="grid grid-cols-2 gap-x-8 pt-4 border-t border-blue-100">
                    <div>{renderSlider('Vision', 'ssV')}{renderSlider('Resonance', 'ssR')}{renderSlider('Context', 'ssC')}</div>
                    <div>{renderSlider('Market', 'vvM')}{renderSlider('Speed', 'vvS')}{renderSlider('Friction', 'vvF')}</div>
                  </div>
                ) : (
                  <div className="flex gap-6 mt-2">
                    <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sync</div><div className="text-xl font-black text-slate-700">{Math.round(p.x)}%</div></div>
                    <div><div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Velocity</div><div className="text-xl font-black text-slate-700">{Math.round(p.y)}%</div></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}