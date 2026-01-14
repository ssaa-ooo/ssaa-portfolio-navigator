'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Settings2, RefreshCw, Save, X, Compass, Star, Edit3, Lightbulb, Users, Camera, TrendingUp } from 'lucide-react';

export default function SSAANavigator() {
  const [data, setData] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [history, setHistory] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempScores, setTempScores] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingVision, setIsEditingVision] = useState(false);
  const [tempVision, setTempVision] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const processed = json.projects.map((p: any) => ({
        ...p,
        x: ((p.ssV * 0.4) + (p.ssR * 0.3) + (p.ssC * 0.3)) * 20,
        y: ((p.vvM * 0.4) + (p.vvS * 0.4) + (p.vvF * 0.2)) * 20,
      }));
      setData(processed);
      setSettings(json.settings || {});
      setHistory(json.history || {});
      setTempVision(json.settings?.Vision_Statement || "");
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // 設定（ビジョンなど）を保存する関数
  const saveSetting = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'Settings', id: key, updates: { Value: value } })
      });
      await fetchData();
      setIsEditingVision(false);
    } catch (err) { alert("保存失敗"); } finally { setIsSaving(false); }
  };

  // プロジェクト評価を保存する関数
  const saveEvaluation = async (id: string) => {
    setIsSaving(true);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'Evaluations', id,
          updates: { 
            'SS_Vision': tempScores.ssV, 'SS_Resonance': tempScores.ssR, 'SS_Context': tempScores.ssC, 
            'VV_Market': tempScores.vvM, 'VV_Speed': tempScores.vvS, 'VV_Friction': tempScores.vvF,
            'Asset_Volume': tempScores.z, 'Lead_Person': tempScores.lead 
          }
        }),
      });
      setEditingId(null);
      await fetchData();
    } catch (err) { alert("保存失敗"); } finally { setIsSaving(false); }
  };

  const takeSnapshot = async () => {
    if (!confirm("現在の数値を今月の履歴として保存しますか？")) return;
    setIsSaving(true);
    try {
      await fetch('/api/data', { method: 'POST', body: JSON.stringify({ target: 'Snapshot' }) });
      alert("Snapshotを保存しました。履歴との比較が可能になります。");
      await fetchData();
    } catch (err) { alert("保存失敗"); } finally { setIsSaving(false); }
  };

  const renderSlider = (label: string, key: string, min = 1, max = 5) => (
    <div className="mb-6">
      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2">
        <span>{label}</span>
        <span className="text-blue-600 bg-blue-50 px-2 rounded-md">{tempScores[key]}</span>
      </div>
      <input type="range" min={min} max={max} step="1" value={tempScores[key]} onChange={e => setTempScores({...tempScores, [key]: parseInt(e.target.value)})} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
      {max === 5 && <p className="text-[9px] text-blue-500 font-bold mt-2 italic min-h-[2.5em]">{settings[`Score_${tempScores[key]}_Def`]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 leading-relaxed">
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">SSAA Navigator</h1>
            <p className="text-slate-400 font-medium text-xs tracking-[0.3em] uppercase">Phase 3: Agile Steering</p>
          </div>
          <div className="flex gap-3">
            <button onClick={takeSnapshot} disabled={isSaving} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95">
              <Camera className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-widest text-slate-700">Snapshot</span>
            </button>
            <button onClick={fetchData} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-bold text-xs uppercase tracking-widest text-white">Sync Now</span>
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl">
          {!isEditingVision ? (
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in duration-700">
              <div className="flex items-center gap-8">
                <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-inner">
                  <Compass className="w-12 h-12 text-blue-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2 opacity-60 font-black text-[10px] uppercase tracking-[0.4em]"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> North Star</div>
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-tight leading-tight">「{settings.Vision_Statement || "ビジョンを定義してください"}」</h2>
                </div>
              </div>
              <button onClick={() => setIsEditingVision(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-sm font-bold flex items-center gap-2 transition-all"><Edit3 className="w-4 h-4" /> Edit Vision</button>
            </div>
          ) : (
            <div className="relative z-10 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-6"><Lightbulb className="w-6 h-6 text-yellow-400" /><h3 className="font-black text-xl tracking-tight">Vision Crafting</h3></div>
              <textarea value={tempVision} onChange={(e) => setTempVision(e.target.value)} className="w-full bg-white/10 border-2 border-white/20 rounded-3xl p-6 text-xl font-bold outline-none mb-6 min-h-[120px] focus:border-white/50 transition-all" />
              <div className="flex gap-3">
                <button onClick={() => saveSetting('Vision_Statement', tempVision)} disabled={isSaving} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-blue-50 transition-all">Save Vision</button>
                <button onClick={() => setIsEditingVision(false)} className="px-8 py-4 bg-transparent border border-white/20 rounded-2xl font-black hover:bg-white/10 transition-all">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[650px] relative overflow-hidden">
          <h2 className="text-2xl font-black mb-10 text-slate-800 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
            Momentum Orbit
          </h2>
          
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 0, right: 20, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
              <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
              <ZAxis type="number" dataKey="z" range={[100, 3000]} />
              <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="8 8" />
              <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="8 8" />
              
              {data.map((p) => {
                const prev = history[p.id];
                if (!prev) return null;
                return (
                  <ReferenceLine key={`trail-${p.id}`} segment={[{ x: prev.x, y: prev.y }, { x: p.x, y: p.y }]} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" />
                );
              })}

              <Scatter name="Current" data={data}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.x >= 60 && entry.y >= 60 ? '#2563eb' : entry.x < 40 && entry.y < 40 ? '#f43f5e' : '#f59e0b'} 
                    fillOpacity={0.7}
                    stroke={entry.x >= 60 && entry.z < 50 ? '#fbbf24' : 'none'}
                    strokeWidth={4}
                  />
                ))}
              </Scatter>
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-5 space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
          {data.map((p) => (
            <div key={p.id} className={`p-6 rounded-[2.5rem] border bg-white transition-all duration-300 ${editingId === p.id ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-slate-800 text-xl tracking-tight leading-tight mb-2">{p.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest">{p.id}</span>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><Users className="w-3 h-3" /> {p.lead}</div>
                  </div>
                </div>
                {editingId !== p.id ? (
                  <button onClick={() => { setEditingId(p.id); setTempScores({...p}); }} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Settings2 className="w-5 h-5" /></button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => saveEvaluation(p.id)} disabled={isSaving} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Save className="w-5 h-5" /></button>
                    <button onClick={() => setEditingId(null)} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl"><X className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              {editingId === p.id ? (
                <div className="pt-6 border-t border-slate-50 space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-x-8">
                    <div>{renderSlider('Vision', 'ssV')}{renderSlider('Resonance', 'ssR')}{renderSlider('Context', 'ssC')}</div>
                    <div>{renderSlider('Market', 'vvM')}{renderSlider('Speed', 'vvS')}{renderSlider('Friction', 'vvF')}</div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4 shadow-inner">
                    {renderSlider('Asset Volume', 'z', 10, 200)}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 tracking-widest">Lead Person</label>
                      <input type="text" value={tempScores.lead} onChange={e => setTempScores({...tempScores, lead: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-end border-t pt-4 border-slate-50">
                  <div className="flex gap-6">
                    <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-tighter">Sync</p><p className="text-xl font-black text-slate-700">{Math.round(p.x)}%</p></div>
                    <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-tighter">Velocity</p><p className="text-xl font-black text-slate-700">{Math.round(p.y)}%</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-tighter">Asset Harmony</p>
                    <div className="flex items-center gap-1 justify-end">
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden inline-block mr-1">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min((p.z/200)*100, 100)}%` }}></div>
                      </div>
                      <span className="text-sm font-black text-blue-600">{p.z}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}