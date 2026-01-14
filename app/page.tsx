'use client';

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { Settings2, RefreshCw, Save, X, Info } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">SSAA Portfolio Navigator</h1>
          <p className="text-slate-500 font-medium italic">Interactive Decision Support System</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-bold text-sm">Sync Now</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="x" domain={[0, 100]} />
                <YAxis type="number" dataKey="y" domain={[0, 100]} />
                <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Projects" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.x >= 60 && entry.y >= 60 ? '#2563eb' : '#f43f5e'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {data.map((p) => (
            <div key={p.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-slate-800 text-lg">{p.name}</h3>
                {editingId !== p.id ? (
                  <button onClick={() => { setEditingId(p.id); setTempScores({ ssV: p.ssV, ssR: p.ssR, ssC: p.ssC, vvM: p.vvM, vvS: p.vvS, vvF: p.vvF }); }} className="p-2 bg-slate-50 rounded-xl">
                    <Settings2 className="w-5 h-5 text-slate-400" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(p.id)} disabled={isSaving} className="p-2 bg-blue-600 text-white rounded-xl"><Save className="w-5 h-5" /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 bg-white border border-slate-200 rounded-xl"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>
              {editingId === p.id && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>{renderSlider('Vision', 'ssV')}{renderSlider('Resonance', 'ssR')}{renderSlider('Context', 'ssC')}</div>
                  <div>{renderSlider('Market', 'vvM')}{renderSlider('Speed', 'vvS')}{renderSlider('Friction', 'vvF')}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}