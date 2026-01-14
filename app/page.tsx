'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Settings2, RefreshCw, Save, X, Compass, Star, Edit3, Users, Camera, TrendingUp, AlertCircle, MessageSquare, ListChecks, Target, Clock, Info, ShieldCheck } from 'lucide-react';

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
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [hoveredFramework, setHoveredFramework] = useState<string | null>(null);

  const agendaDetails = [
    { title: "01. Dashboard View", subtitle: "信号機とKPIの現状確認", checklists: ["主要KPIの達成率は妥当か？", "予算進捗に異常はないか？", "信号機の『色』に直感的な違和感はないか？"] },
    { title: "02. SSAA Insight", subtitle: "現場の『行動速度』の洞察", checklists: ["行動密度（Velocity）は維持されているか？", "新たな組織的・技術的な『摩擦』はないか？", "Insightsの予兆が数値にどう影響するか？"] },
    { title: "03. Strategic Option", subtitle: "次月のリソース配分案", checklists: ["追加のアセット投入で劇的な加速は見込めるか？", "『撤退準備』を検討すべき客観的サインはあるか？", "エースが最重要課題に配置されているか？"] },
    { title: "04. Decision", subtitle: "会社としての判断確定", checklists: ["Go / No Go / Pivot を明確に確定したか？", "アセットの移動に全役員が合意したか？", "次回までの改善目標（マイルストーン）は何か？"] }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      const totalHours = json.projects.reduce((sum: number, p: any) => sum + p.hours, 0);
      const processed = json.projects.map((p: any) => ({
        ...p,
        x: ((p.ssV * 0.4) + (p.ssR * 0.3) + (p.ssC * 0.3)) * 20,
        y: ((p.vvM * 0.4) + (p.vvS * 0.4) + (p.vvF * 0.2)) * 20,
        z: totalHours > 0 ? (p.hours / totalHours) * 100 : 20,
        ratio: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0
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
            'Work_Hours': tempScores.hours, 'Lead_Person': tempScores.lead,
            'Status': tempScores.status, 'SSAA_Insight': tempScores.insight
          }
        }),
      });
      setEditingId(null);
      await fetchData();
    } catch (err) { alert("保存失敗"); } finally { setIsSaving(false); }
  };

  const renderSlider = (label: string, key: string) => (
    <div className="mb-4">
      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1">
        <span>{label}</span>
        <span className="text-blue-600 font-bold">{tempScores[key]}/5</span>
      </div>
      <input type="range" min="1" max="5" value={tempScores[key]} onChange={e => setTempScores({...tempScores, [key]: parseInt(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
      <p className="text-[8px] text-blue-400 font-bold italic mt-1">{settings[`Score_${tempScores[key]}_Def`]}</p>
    </div>
  );

  const counts = { keep: data.filter(p => p.status === 'Green').length, exit: data.filter(p => p.status === 'Red').length };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 leading-relaxed overflow-x-hidden">
      
      {selectedStep !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStep(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedStep(null)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
            <div className="mb-8">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{agendaDetails[selectedStep].title}</h3>
              <p className="text-slate-400 font-bold text-sm italic">{agendaDetails[selectedStep].subtitle}</p>
            </div>
            <div className="space-y-3">
              {agendaDetails[selectedStep].checklists.map((item, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-300 transition-all">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 group-hover:border-blue-500 transition-all"><div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100" /></div>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic flex items-center gap-3">SSAA Navigator <Target className="w-8 h-8 text-blue-600" /></h1>
          <p className="text-slate-400 font-medium text-xs tracking-[0.3em] uppercase tracking-widest">Agile Steering Mode</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert("Snapshot saved.")} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:shadow-md transition-all"><Camera className="w-4 h-4" /> Snapshot</button>
          <button onClick={fetchData} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Now</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[550px] relative overflow-hidden group">
            <h2 className="text-2xl font-black mb-10 text-slate-800 flex items-center gap-3 relative z-10"><TrendingUp className="w-6 h-6 text-blue-600" /> Momentum Orbit</h2>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] font-black text-6xl uppercase select-none group-hover:opacity-[0.05] transition-all duration-1000">
              <div className="grid grid-cols-2 w-full h-full p-20">
                <div className="flex items-start justify-start">Pivot</div><div className="flex items-start justify-end">Star</div>
                <div className="flex items-end justify-start">Stop</div><div className="flex items-end justify-end">Scale</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 0, right: 20, bottom: 40, left: 0 }}>
                <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" /></marker></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="z" range={[150, 4000]} />
                <ReferenceLine x={50} stroke="#e2e8f0" strokeWidth={2} />
                <ReferenceLine y={50} stroke="#e2e8f0" strokeWidth={2} />
                {data.map((p) => {
                  const prev = history[p.id];
                  if (prev && (Math.abs(prev.x - p.x) > 2 || Math.abs(prev.y - p.y) > 2)) {
                    return <ReferenceLine key={`t-${p.id}`} segment={[{x: prev.x, y: prev.y}, {x: p.x, y: p.y}]} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" markerEnd="url(#arrow)" />
                  }
                  return null;
                })}
                <Scatter name="Current" data={data}>
                  {data.map((entry, index) => (
                    <Cell key={index} 
                      fill={entry.status === 'Green' ? '#2563eb' : entry.status === 'Yellow' ? '#f59e0b' : '#f43f5e'} 
                      fillOpacity={hoveredFramework ? (
                        (hoveredFramework === 'Keep' && entry.status === 'Green') || (hoveredFramework === 'Exit' && entry.status === 'Red') ? 0.9 : 0.1
                      ) : 0.85} 
                    />
                  ))}
                </Scatter>
                <Tooltip />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-32 h-32" /></div>
             <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-6 text-blue-400"><AlertCircle className="w-4 h-4" /> Selection Framework Analysis</h3>
             <div className="grid grid-cols-2 gap-8 relative z-10">
                <div onMouseEnter={() => setHoveredFramework('Keep')} onMouseLeave={() => setHoveredFramework(null)} className={`space-y-4 p-6 rounded-3xl border transition-all cursor-pointer ${hoveredFramework === 'Keep' ? 'bg-white/5 border-green-500/50 scale-[1.02]' : 'border-white/5'}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2"><div className="text-green-400 font-black text-[10px] uppercase tracking-widest">Keep: 継続・拡張</div><div className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{counts.keep} PJ</div></div>
                  <p className="text-[11px] leading-relaxed text-slate-400">反応が加速し、現場の行動密度が高い状態。リソースを追加投入し、仕組み化を急ぐ。</p>
                </div>
                <div onMouseEnter={() => setHoveredFramework('Exit')} onMouseLeave={() => setHoveredFramework(null)} className={`space-y-4 p-6 rounded-3xl border transition-all cursor-pointer ${hoveredFramework === 'Exit' ? 'bg-white/5 border-red-500/50 scale-[1.02]' : 'border-white/5'}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2"><div className="text-red-400 font-black text-[10px] uppercase tracking-widest">Exit: 撤退・回収</div><div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{counts.exit} PJ</div></div>
                  <p className="text-[11px] leading-relaxed text-slate-400">3ヶ月連続で速度が横ばい。感情を排し資源を他へ移転する。</p>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-6"><ListChecks className="w-4 h-4" /> Steering Agenda</h3>
            <div className="space-y-2">
              {agendaDetails.map((item, idx) => (
                <button key={idx} onClick={() => setSelectedStep(idx)} className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] transition-all group border border-white/5 text-left">
                  <div className="flex items-center gap-3"><span className="text-[10px] font-black opacity-40">0{idx+1}</span><span className="text-[11px] font-bold tracking-tight">{item.title.split('. ')[1]}</span></div>
                  <Info className="w-4 h-4 opacity-30 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.map((p) => (
              <div key={p.id} className={`p-6 rounded-[2.5rem] border bg-white transition-all duration-300 ${editingId === p.id ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${p.status === 'Green' ? 'bg-blue-600' : p.status === 'Yellow' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
                    <div><h3 className="font-black text-slate-800 text-lg tracking-tight">{p.name}</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.id} • {p.lead}</p></div>
                  </div>
                  {editingId !== p.id ? (
                    <button onClick={() => { setEditingId(p.id); setTempScores({...p}); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Settings2 className="w-5 h-5" /></button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => saveEvaluation(p.id)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"><Save className="w-5 h-5" /></button>
                      <button onClick={() => setEditingId(null)} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl"><X className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>
                {editingId === p.id ? (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <div className="grid grid-cols-2 gap-x-6">
                      <div><p className="text-[8px] font-black text-slate-300 uppercase mb-3 border-b pb-1">Strategic Sync</p>{['ssV', 'ssR', 'ssC'].map(k => renderSlider(k.replace('ss', ''), k))}</div>
                      <div><p className="text-[8px] font-black text-slate-300 uppercase mb-3 border-b pb-1">Value Velocity</p>{['vvM', 'vvS', 'vvF'].map(k => renderSlider(k.replace('vv', ''), k))}</div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-4 shadow-inner">
                      <div className="flex gap-4"><div className="flex-1"><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Work Hours</label><input type="number" value={tempScores.hours} onChange={e => setTempScores({...tempScores, hours: parseInt(e.target.value) || 0})} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold outline-none" /></div><div className="flex-1"><label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Lead Person</label><input type="text" value={tempScores.lead} onChange={e => setTempScores({...tempScores, lead: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold outline-none" /></div></div>
                      <div className="flex gap-2">{['Green', 'Yellow', 'Red'].map(s => ( <button key={s} onClick={() => setTempScores({...tempScores, status: s})} className={`flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${tempScores.status === s ? 'bg-white border-blue-500 text-blue-600' : 'bg-transparent border-slate-200 text-slate-300'}`}>{s}</button>))}</div>
                      <textarea value={tempScores.insight} onChange={e => setTempScores({...tempScores, insight: e.target.value})} className="w-full bg-white border border-slate-100 rounded-xl p-3 text-[10px] font-bold outline-none h-20" placeholder="SSAA Insights..." />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-t pt-4 border-slate-50">
                      <div className="flex gap-4"><div><p className="text-[8px] font-black text-slate-300 uppercase mb-1">Sync</p><p className="text-lg font-black">{Math.round(p.x)}%</p></div><div><p className="text-[8px] font-black text-slate-300 uppercase mb-1">Velocity</p><p className="text-lg font-black">{Math.round(p.y)}%</p></div></div>
                      <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase mb-1">Asset Share</p><p className="text-lg font-black text-blue-600">{p.ratio}% <span className="text-[10px] text-slate-300">({p.hours}h)</span></p></div>
                    </div>
                    {p.insight && <div className="p-4 bg-blue-50/50 rounded-2xl border-l-4 border-blue-500"><p className="text-[10px] font-bold text-blue-700 italic leading-relaxed">"{p.insight}"</p></div>}
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