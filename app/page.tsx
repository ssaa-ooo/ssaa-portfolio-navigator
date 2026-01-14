'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Settings2, RefreshCw, Save, X, Compass, Star, Edit3, Users, Camera, TrendingUp, AlertTriangle, MessageSquare, ListChecks, ArrowUpRight, Target, ShieldCheck } from 'lucide-react';

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

  const getRecommendation = (p: any) => {
    if (p.x >= 60 && p.y >= 60) return { label: "STAR: 集中投資", color: "text-blue-600", bg: "bg-blue-50" };
    if (p.x < 40 && p.y < 40) return { label: "STOP: 資源回収", color: "text-red-600", bg: "bg-red-50" };
    if (p.x >= 60 && p.y < 60) return { label: "SPEED UP: 仕組み化", color: "text-amber-600", bg: "bg-amber-50" };
    return { label: "PIVOT: 戦略再考", color: "text-slate-600", bg: "bg-slate-100" };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 selection:bg-blue-100">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="group">
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic flex items-center gap-3">
            SSAA Navigator <Target className="w-8 h-8 text-blue-600" />
          </h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.4em] uppercase mt-1">Strategic Selection & Asset Harmony</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert("Snapshot saved.")} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:shadow-xl transition-all active:scale-95"><Camera className="w-4 h-4" /> Snapshot</button>
          <button onClick={fetchData} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Now</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Map & Advice */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm h-[600px] relative overflow-hidden">
            <div className="absolute top-8 right-10 flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-300">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200" /> Previous</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600" /> Current</span>
            </div>
            
            <h2 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" /> Momentum Orbit
            </h2>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] font-black text-6xl uppercase tracking-[0.2em] select-none">
              <div className="grid grid-cols-2 w-full h-full p-20">
                <div className="flex items-start justify-start">Pivot</div>
                <div className="flex items-start justify-end">Star</div>
                <div className="flex items-end justify-start">Stop</div>
                <div className="flex items-end justify-end">Scale</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
                  </marker>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="z" range={[150, 2500]} />
                <ReferenceLine x={50} stroke="#e2e8f0" strokeWidth={2} />
                <ReferenceLine y={50} stroke="#e2e8f0" strokeWidth={2} />
                
                {data.map((p) => {
                  const prev = history[p.id];
                  if (prev && (Math.abs(prev.x - p.x) > 2 || Math.abs(prev.y - p.y) > 2)) {
                    return <ReferenceLine key={`t-${p.id}`} segment={[{x: prev.x, y: prev.y}, {x: p.x, y: p.y}]} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" markerEnd="url(#arrow)" />
                  }
                  return null;
                })}
                <Scatter name="Previous" data={Object.keys(history).map(id => ({ id, ...history[id], z: 50 }))}>
                  {Object.keys(history).map((id) => <Cell key={`prev-${id}`} fill="#e2e8f0" />)}
                </Scatter>
                <Scatter name="Current" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.status === 'Green' ? '#2563eb' : entry.status === 'Yellow' ? '#f59e0b' : '#f43f5e'} fillOpacity={0.9} />
                  ))}
                </Scatter>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="w-24 h-24" /></div>
             <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-6 text-blue-400">Selection Framework</h3>
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-400 font-black text-[10px] uppercase border-b border-white/10 pb-2">Keep: 継続・拡張</div>
                  <p className="text-[11px] leading-relaxed text-slate-300">施策ごとに反応が加速しており、現場の行動密度が高い状態。リソースを追加投入し、仕組み化を急ぐ。</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase border-b border-white/10 pb-2">Exit: 撤退・回収</div>
                  <p className="text-[11px] leading-relaxed text-slate-300">3ヶ月連続でVelocityが横ばい。またはAsset投入量に対してSyncが低下している。感情を排し、資源を他へ移転する。</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Agenda & Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-100 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4" /> Steering Agenda</h3>
              <p className="text-[10px] font-bold opacity-70">経営判断を最短にする4ステップ</p>
            </div>
            <ArrowUpRight className="w-8 h-8 opacity-50" />
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {data.map((p) => {
              const advice = getRecommendation(p);
              return (
                <div key={p.id} className={`p-6 rounded-[2.5rem] border bg-white transition-all duration-500 ${editingId === p.id ? 'border-blue-500 shadow-2xl ring-4 ring-blue-50' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${p.status === 'Green' ? 'bg-blue-600' : p.status === 'Yellow' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
                      <div>
                        <h3 className="font-black text-slate-800 text-lg leading-none">{p.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{p.id} • {p.lead}</p>
                      </div>
                    </div>
                    {editingId !== p.id ? (
                      <button onClick={() => { setEditingId(p.id); setTempScores({...p}); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Settings2 className="w-5 h-5" /></button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => saveEvaluation(p.id)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><Save className="w-5 h-5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl"><X className="w-5 h-5" /></button>
                      </div>
                    )}
                  </div>

                  {editingId === p.id ? (
                    <div className="pt-4 border-t border-slate-50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {['ssV', 'vvS'].map(k => (
                          <div key={k}>
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1"><span>{k}</span><span>{tempScores[k]}/5</span></div>
                            <input type="range" min="1" max="5" value={tempScores[k]} onChange={e => setTempScores({...tempScores, [k]: parseInt(e.target.value)})} className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-blue-600" />
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                        <div className="flex gap-2">
                          {['Green', 'Yellow', 'Red'].map(s => (
                            <button key={s} onClick={() => setTempScores({...tempScores, status: s})} className={`flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${tempScores.status === s ? 'bg-white border-blue-500 text-blue-600' : 'bg-transparent border-slate-200 text-slate-300'}`}>{s}</button>
                          ))}
                        </div>
                        <textarea value={tempScores.insight} onChange={e => setTempScores({...tempScores, insight: e.target.value})} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none h-20" placeholder="SSAA Insights..." />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={`px-4 py-2 rounded-xl ${advice.bg} ${advice.color} text-[10px] font-black uppercase tracking-widest inline-block`}>{advice.label}</div>
                      {p.insight && (
                        <div className="relative p-4 bg-slate-50 rounded-[1.5rem] border-l-4 border-blue-500">
                          <MessageSquare className="absolute -top-2 -left-2 w-5 h-5 text-blue-500 bg-white rounded-full p-1 border border-blue-100 shadow-sm" />
                          <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">"{p.insight}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}