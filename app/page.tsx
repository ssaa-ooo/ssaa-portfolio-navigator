'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Settings2, RefreshCw, Save, X, Compass, Star, Edit3, Users, Camera, TrendingUp, AlertCircle, MessageSquare, ListChecks, Lightbulb } from 'lucide-react';

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
            'Asset_Volume': tempScores.z, 'Lead_Person': tempScores.lead,
            'Status': tempScores.status, 'SSAA_Insight': tempScores.insight
          }
        }),
      });
      setEditingId(null);
      await fetchData();
    } catch (err) { alert("保存失敗"); } finally { setIsSaving(false); }
  };

  const takeSnapshot = async () => {
    if (!confirm("現在の数値を履歴(Snapshot)として保存しますか？")) return;
    setIsSaving(true);
    try {
      await fetch('/api/data', { method: 'POST', body: JSON.stringify({ target: 'Snapshot' }) });
      alert("Snapshot保存完了。");
      await fetchData();
    } catch (err) { alert("失敗"); } finally { setIsSaving(false); }
  };

  const renderSlider = (label: string, key: string) => (
    <div className="mb-4">
      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
        <span>{label}</span>
        <span className="text-blue-600 font-bold">{tempScores[key]}/5</span>
      </div>
      <input type="range" min="1" max="5" value={tempScores[key]} onChange={e => setTempScores({...tempScores, [key]: parseInt(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
      <p className="text-[8px] text-blue-400 font-bold italic mt-1">{settings[`Score_${tempScores[key]}_Def`]}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 leading-relaxed">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic">SSAA Navigator</h1>
          <p className="text-slate-400 font-medium text-xs tracking-[0.3em] uppercase">Agile Steering Mode</p>
        </div>
        <div className="flex gap-3">
          <button onClick={takeSnapshot} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:shadow-md transition-all"><Camera className="w-4 h-4" /> Snapshot</button>
          <button onClick={fetchData} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Now</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* 左側：Orbit Map & Criteria */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[550px] relative">
            <h2 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
              Momentum Orbit
            </h2>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 0, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="z" range={[100, 2000]} />
                <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="8 8" />
                <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="8 8" />
                {data.map((p) => {
                  const prev = history[p.id];
                  if (prev && (prev.x !== p.x || prev.y !== p.y)) {
                    return <ReferenceLine key={`t-${p.id}`} segment={[{x: prev.x, y: prev.y}, {x: p.x, y: p.y}]} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" />
                  }
                  return null;
                })}
                <Scatter name="Current" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.status === 'Green' ? '#22c55e' : entry.status === 'Yellow' ? '#eab308' : '#ef4444'} fillOpacity={0.8} />
                  ))}
                </Scatter>
                <Tooltip />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-6 text-blue-400">
              <AlertCircle className="w-4 h-4" /> SSAA Decision Framework
            </h3>
            <div className="grid grid-cols-2 gap-8 text-[11px]">
              <div className="space-y-3">
                <p className="text-green-400 font-bold uppercase tracking-widest border-b border-green-400/30 pb-2">継続基準 (Green)</p>
                <p><span className="text-slate-400 block mb-1 font-bold">Value Velocity:</span> 改善施策を打つたびに顧客の反応が加速している。</p>
                <p><span className="text-slate-400 block mb-1 font-bold">Strategic Sync:</span> チームの共感度が高く、自律的に動いている。</p>
              </div>
              <div className="space-y-3">
                <p className="text-red-400 font-bold uppercase tracking-widest border-b border-red-400/30 pb-2">撤退・再検討基準 (Red)</p>
                <p><span className="text-slate-400 block mb-1 font-bold">Value Velocity:</span> 3ヶ月施策を繰り返しても反応が横ばい・減速。</p>
                <p><span className="text-slate-400 block mb-1 font-bold">Strategic Sync:</span> 現場に疲弊感があり、行動速度が上がらない。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：Agenda & List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-200">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-4">
              <ListChecks className="w-4 h-4" /> Steering Session Agenda
            </h3>
            <ol className="space-y-2 text-[11px] font-bold opacity-90">
              <li className="flex gap-2"><span>01</span> Dashboard View: 売上・コスト・信号機の確認</li>
              <li className="flex gap-2"><span>02</span> SSAA Insight: 行動速度と摩擦の洞察共有</li>
              <li className="flex gap-2"><span>03</span> Strategic Option: 舵取り案（維持・追加・撤退）</li>
              <li className="flex gap-2"><span>04</span> Decision: 経営者による会社判断の確定</li>
            </ol>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.map((p) => (
              <div key={p.id} className={`p-6 rounded-[2.5rem] border bg-white transition-all duration-300 ${editingId === p.id ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${p.status === 'Green' ? 'bg-green-500' : p.status === 'Yellow' ? 'bg-yellow-500' : 'bg-red-500'} shadow-sm`} />
                    <h3 className="font-black text-slate-800 text-lg tracking-tight">{p.name}</h3>
                  </div>
                  {editingId !== p.id ? (
                    <button onClick={() => { setEditingId(p.id); setTempScores({...p}); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Settings2 className="w-5 h-5" /></button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => saveEvaluation(p.id)} disabled={isSaving} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200"><Save className="w-5 h-5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl"><X className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>

                {editingId === p.id ? (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <div className="grid grid-cols-2 gap-4">{renderSlider('Sync', 'ssV')}{renderSlider('Vel', 'vvS')}</div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-4 shadow-inner">
                      <div className="flex gap-2">
                        {['Green', 'Yellow', 'Red'].map(s => (
                          <button key={s} onClick={() => setTempScores({...tempScores, status: s})} className={`flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${tempScores.status === s ? 'bg-white border-blue-500 text-blue-600' : 'bg-transparent border-slate-200 text-slate-400'}`}>{s}</button>
                        ))}
                      </div>
                      <textarea value={tempScores.insight} onChange={e => setTempScores({...tempScores, insight: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-[10px] font-bold outline-none" placeholder="SSAAからの洞察（現場の行動速度や摩擦）を入力..." />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-6 border-t pt-4 border-slate-50">
                      <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Momentum</p><p className="text-xl font-black text-slate-700">{Math.round((p.x + p.y)/2)}%</p></div>
                      <div><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Asset Vol</p><p className="text-xl font-black text-blue-600">{p.z}</p></div>
                    </div>
                    {p.insight && (
                      <div className="flex gap-2 p-3 bg-blue-50/50 rounded-2xl">
                        <MessageSquare className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-700 italic leading-relaxed">"{p.insight}"</p>
                      </div>
                    )}
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