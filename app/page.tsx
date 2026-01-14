'use client';

import React, { useState, useEffect } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';
import { Settings2, RefreshCw, Save, X, Compass, HelpCircle, Star } from 'lucide-react';

export default function SSAANavigator() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempScores, setTempScores] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 本来はSettingsシートから取得しますが、まずはデモ用に定数で定義
  const NORTH_STAR = "誰もが自律的に価値を創造できる世界を作る";
  const SCORE_GUIDE: { [key: number]: string } = {
    5: "完璧な同期：経営計画の最優先事項",
    4: "高い貢献：明確な優位性と確信",
    3: "平均的：現状維持または要改善",
    2: "懸念あり：戦略との乖離が見られる",
    1: "撤退検討：リソースの浪費"
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      const processed = json.map((p: any) => ({
        ...p,
        x: ((p.ssV * 0.4) + (p.ssR * 0.3) + (p.ssC * 0.3)) * 20,
        y: ((p.vvM * 0.4) + (p.vvS * 0.4) + (p.vvF * 0.2)) * 20,
      }));
      setData(processed);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates: {
            'SS_Vision': tempScores.ssV, 'SS_Resonance': tempScores.ssR, 'SS_Context': tempScores.ssC,
            'VV_Market': tempScores.vvM, 'VV_Speed': tempScores.vvS, 'VV_Friction': tempScores.vvF,
          }
        }),
      });
      setEditingId(null);
      await fetchData();
    } catch (err) { alert("保存に失敗しました"); } finally { setIsSaving(false); }
  };

  const renderSlider = (label: string, key: string) => (
    <div className="mb-5 group">
      <div className="flex justify-between items-end mb-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <span className="text-sm font-black text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md">{tempScores[key]} / 5</span>
      </div>
      <input
        type="range" min="1" max="5" step="1"
        value={tempScores[key]}
        onChange={(e) => setTempScores({ ...tempScores, [key]: parseInt(e.target.value) })}
        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 mb-2"
      />
      {/* 5段階評価の定義をリアルタイム表示 */}
      <p className="text-[10px] text-blue-500 font-bold italic leading-tight min-h-[1.5em]">
        {SCORE_GUIDE[tempScores[key]]}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-800">SSAA Navigator</h1>
            <p className="text-slate-400 font-medium">Strategic Selection & Asset Harmony</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-bold uppercase tracking-widest text-xs">Sync Now</span>
          </button>
        </div>

        {/* North Star Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-3xl">
              <Compass className="w-10 h-10 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">The North Star Vision</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight italic">
                「{NORTH_STAR}」
              </h2>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Orbit Map */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-blue-50 rounded-2xl"><Settings2 className="w-6 h-6 text-blue-600" /></div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Selection Orbit</h2>
          </div>
          
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 5" />
                <Scatter name="Projects" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.x >= 60 && entry.y >= 60 ? '#2563eb' : '#f43f5e'} className="drop-shadow-lg" />
                  ))}
                </Scatter>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Intelligence */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Project Intelligence</h2>
            <HelpCircle className="w-4 h-4 text-slate-300" />
          </div>

          <div className="space-y-4">
            {data.map((p) => (
              <div key={p.id} className={`p-6 rounded-[2rem] border transition-all duration-500 ${editingId === p.id ? 'bg-white border-blue-400 shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-slate-800 text-xl tracking-tight mb-1">{p.name}</h3>
                    <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest">{p.id}</span>
                  </div>
                  {editingId !== p.id ? (
                    <button onClick={() => { setEditingId(p.id); setTempScores({...p}); }} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                      <Settings2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(p.id)} disabled={isSaving} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><Save className="w-5 h-5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl"><X className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>

                {editingId === p.id ? (
                  <div className="grid grid-cols-2 gap-x-8 pt-6 border-t border-slate-50">
                    <div>{renderSlider('Vision', 'ssV')}{renderSlider('Resonance', 'ssR')}{renderSlider('Context', 'ssC')}</div>
                    <div>{renderSlider('Market', 'vvM')}{renderSlider('Speed', 'vvS')}{renderSlider('Friction', 'vvF')}</div>
                  </div>
                ) : (
                  <div className="flex gap-8">
                    <div><p className="text-[10px] font-black text-slate-300 uppercase mb-1">Sync</p><p className="text-2xl font-black text-slate-700">{Math.round(p.x)}%</p></div>
                    <div><p className="text-[10px] font-black text-slate-300 uppercase mb-1">Velocity</p><p className="text-2xl font-black text-slate-700">{Math.round(p.y)}%</p></div>
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