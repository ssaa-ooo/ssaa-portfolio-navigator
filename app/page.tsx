'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Settings2, RefreshCw, Save, X, Compass, Target, Clock, Info, ShieldCheck, BarChart3, Coins, Gavel, Calendar, Users, Camera, ListChecks, MessageSquare, LayoutDashboard, Edit3, Star, TrendingUp, AlertCircle } from 'lucide-react';

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
        ratio: totalHours > 0 ? Math.round((p.hours / totalHours) * 100) : 0,
        roi: p.hours > 0 ? Math.round(p.aProf / p.hours) : 0
      }));
      setData(processed);
      setSettings(json.settings || {});
      setHistory(json.history || {});
      setTempVision(json.settings?.Vision_Statement || "");
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ビジョン保存用
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
            'Work_Hours': tempScores.hours, 'Lead_Person': tempScores.lead,
            'Status': tempScores.status, 'SSAA_Insight': tempScores.insight,
            'Target_Revenue': tempScores.tRev, 'Actual_Revenue': tempScores.aRev, 
            'Target_Profit': tempScores.tProf, 'Actual_Profit': tempScores.aProf,
            'KPI_Name': tempScores.kpiName, 'KPI_Target': tempScores.kpiT, 'KPI_Actual': tempScores.kpiA,
            'Decision_Date': tempScores.decisionDate, 'Verdict': tempScores.verdict
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
      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1">
        <span>{label}</span>
        <span className="text-blue-600 font-bold">{tempScores[key]}/5</span>
      </div>
      <input type="range" min="1" max="5" value={tempScores[key]} onChange={e => setTempScores({...tempScores, [key]: parseInt(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
      <p className="text-[8px] text-blue-400 font-bold italic mt-1 leading-tight">{settings[`Score_${tempScores[key]}_Def`]}</p>
    </div>
  );

  const counts = { keep: data.filter(p => p.status === 'Green' && p.verdict === 'Pending').length, exit: data.filter(p => p.status === 'Red' || p.verdict === 'Exit').length };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 leading-relaxed overflow-x-hidden">
      
      {/* モーダル表示 */}
      {selectedStep !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStep(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedStep(null)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl"><X className="w-6 h-6 text-slate-400" /></button>
            <div className="mb-8 font-black">
              <h3 className="text-3xl text-slate-800 tracking-tight">{agendaDetails[selectedStep].title}</h3>
              <p className="text-slate-400 text-sm italic">{agendaDetails[selectedStep].subtitle}</p>
            </div>
            <div className="space-y-3">
              {agendaDetails[selectedStep].checklists.map((item, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 group">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex-shrink-0" />
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase italic flex items-center gap-3">SSAA Navigator <Target className="w-8 h-8 text-blue-600" /></h1>
            <p className="text-slate-400 font-medium text-xs tracking-[0.3em] uppercase tracking-widest">Judgment Prism Enabled</p>
          </div>
          <div className="flex gap-3">
            <button onClick={takeSnapshot} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:shadow-md transition-all"><Camera className="w-4 h-4" /> Snapshot</button>
            <button onClick={fetchData} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-black transition-all"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Now</button>
          </div>
        </div>

        {/* Vision Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl">
          {!isEditingVision ? (
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-inner">
                  <Compass className="w-12 h-12 text-blue-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2 opacity-60 font-black text-[10px] uppercase tracking-[0.4em]"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> North Star</div>
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-tight leading-tight">「{settings.Vision_Statement || "ビジョンを定義してください"}」</h2>
                </div>
              </div>
              <button onClick={() => setIsEditingVision(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-sm font-bold flex items-center gap-2"><Edit3 className="w-4 h-4" /> Edit</button>
            </div>
          ) : (
            <div className="relative z-10">
              <textarea value={tempVision} onChange={(e) => setTempVision(e.target.value)} className="w-full bg-white/10 border-2 border-white/20 rounded-3xl p-6 text-xl font-bold outline-none mb-6 min-h-[120px]" />
              <div className="flex gap-3">
                <button onClick={() => saveSetting('Vision_Statement', tempVision)} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black">Save Vision</button>
                <button onClick={() => setIsEditingVision(false)} className="px-8 py-4 bg-transparent border border-white/20 rounded-2xl font-black">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm h-[550px] relative overflow-hidden group">
            <h2 className="text-2xl font-black mb-10 text-slate-800 flex items-center gap-3 relative z-10"><Gavel className="w-6 h-6 text-blue-600" /> Momentum Orbit</h2>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] font-black text-6xl uppercase select-none transition-all">
              <div className="grid grid-cols-2 w-full h-full p-20">
                <div className="flex items-start justify-start text-left">Pivot<br/><span className="text-[10px] lowercase font-medium tracking-normal text-slate-400">共感不足</span></div>
                <div className="flex items-start justify-end text-right">Star<br/><span className="text-[10px] lowercase font-medium tracking-normal text-slate-400">集中投資</span></div>
                <div className="flex items-end justify-start text-left">Stop<br/><span className="text-[10px] lowercase font-medium tracking-normal text-slate-400">資源回収</span></div>
                <div className="flex items-end justify-end text-right">Scale<br/><span className="text-[10px] lowercase font-medium tracking-normal text-slate-400">仕組み化</span></div>
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
                      stroke={entry.verdict !== 'Pending' ? '#000' : 'none'}
                      strokeWidth={2}
                      fillOpacity={hoveredFramework ? (
                        (hoveredFramework === 'Keep' && entry.status === 'Green') || (hoveredFramework === 'Exit' && entry.status === 'Red') ? 0.9 : 0.1
                      ) : 0.85} 
                    />
                  ))}
                </Scatter>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-32 h-32" /></div>
             <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] mb-6 text-blue-400"><AlertCircle className="w-4 h-4" /> Selection Framework Analysis</h3>
             <div className="grid grid-cols-2 gap-8 relative z-10">
                <div onMouseEnter={() => setHoveredFramework('Keep')} onMouseLeave={() => setHoveredFramework(null)} className={`space-y-4 p-6 rounded-3xl border transition-all cursor-pointer ${hoveredFramework === 'Keep' ? 'bg-white/5 border-green-500/50 scale-[1.02]' : 'border-white/5'}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2"><div className="text-green-400 font-black text-[10px] uppercase">Keep: 継続・拡張</div><div className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{counts.keep} PJ</div></div>
                  <p className="text-[11px] text-slate-400">ROIが高く、期限内でのビジョン到達が確実視されるプロジェクト。</p>
                </div>
                <div onMouseEnter={() => setHoveredFramework('Exit')} onMouseLeave={() => setHoveredFramework(null)} className={`space-y-4 p-6 rounded-3xl border transition-all cursor-pointer ${hoveredFramework === 'Exit' ? 'bg-white/5 border-red-500/50 scale-[1.02]' : 'border-white/5'}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2"><div className="text-red-400 font-black text-[10px] uppercase">Exit: 撤退・回収</div><div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{counts.exit} PJ</div></div>
                  <p className="text-[11px] text-slate-400">3ヶ月連続で速度が改善せず、投資効率が基準を下回るもの。</p>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><ListChecks className="w-4 h-4" /> Steering Agenda</h3>
            <div className="flex gap-2">
              {agendaDetails.map((_, i) => (
                <button key={i} onClick={() => setSelectedStep(i)} className="w-8 h-8 rounded-full bg-white/20 text-[10px] font-black flex items-center justify-center hover:bg-white/40 border border-white/10 transition-all">0{i+1}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
            {data.map((p) => (
              <div key={p.id} className={`p-6 rounded-[2.5rem] border bg-white transition-all duration-300 ${p.verdict !== 'Pending' ? 'opacity-50 grayscale shadow-none' : 'shadow-sm hover:shadow-md'} ${editingId === p.id ? 'border-blue-500 shadow-2xl scale-[1.02]' : 'border-slate-100'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${p.status === 'Green' ? 'bg-blue-600' : p.status === 'Yellow' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
                    <div>
                      <h3 className="font-black text-slate-800 text-lg tracking-tight leading-none">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-bold rounded-full uppercase">{p.id}</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 leading-none"><Calendar className="w-2.5 h-2.5" /> 審判: {p.decisionDate || "未定"}</span>
                      </div>
                    </div>
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
                  <div className="pt-4 border-t border-slate-50 space-y-6 animate-in fade-in duration-300">
                    {/* 1. スコア設定 */}
                    <div className="grid grid-cols-2 gap-x-6">
                      <div><p className="text-[8px] font-black text-slate-300 uppercase mb-3 border-b pb-1 tracking-widest">Strategic Sync</p>{['ssV', 'ssR', 'ssC'].map(k => renderSlider(k.replace('ss', ''), k))}</div>
                      <div><p className="text-[8px] font-black text-slate-300 uppercase mb-3 border-b pb-1 tracking-widest">Value Velocity</p>{['vvM', 'vvS', 'vvF'].map(k => renderSlider(k.replace('vv', ''), k))}</div>
                    </div>
                    
                    {/* 2. 稼働設定 */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <div><label className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Work Hours (Monthly)</label><input type="number" value={tempScores.hours} onChange={e => setTempScores({...tempScores, hours: parseInt(e.target.value) || 0})} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold outline-none" /></div>
                       <div><label className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Lead Person</label><input type="text" value={tempScores.lead} onChange={e => setTempScores({...tempScores, lead: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold outline-none" /></div>
                    </div>

                    {/* 3. 業績管理 (黒背景) */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-6 space-y-6 text-white shadow-2xl relative border border-white/5">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-1 mb-2"><BarChart3 className="w-3 h-3" /> 売上管理</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-3 rounded-2xl">
                            <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">目標売上 (Target)</label>
                            <input type="number" value={tempScores.tRev} onChange={e => setTempScores({...tempScores, tRev: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black outline-none border-none p-0 focus:ring-0" />
                          </div>
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <label className="text-[8px] font-black text-blue-400 uppercase block mb-1">実績売上 (Actual)</label>
                            <input type="number" value={tempScores.aRev} onChange={e => setTempScores({...tempScores, aRev: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black outline-none border-none p-0 focus:ring-0" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-1 mb-2"><Coins className="w-3 h-3" /> 利益管理</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-3 rounded-2xl">
                            <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">目標利益 (Target)</label>
                            <input type="number" value={tempScores.tProf} onChange={e => setTempScores({...tempScores, tProf: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black outline-none border-none p-0 focus:ring-0" />
                          </div>
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <label className="text-[8px] font-black text-emerald-400 uppercase block mb-1">実績利益 (Actual)</label>
                            <input type="number" value={tempScores.aProf} onChange={e => setTempScores({...tempScores, aProf: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black outline-none border-none p-0 focus:ring-0" />
                          </div>
                        </div>
                      </div>

                      {/* 復活：KPIセクション */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-1 mb-2">
                           <LayoutDashboard className="w-3 h-3 text-amber-400" />
                           <input type="text" value={tempScores.kpiName} onChange={e => setTempScores({...tempScores, kpiName: e.target.value})} className="bg-transparent text-[10px] font-black text-amber-400 uppercase outline-none w-full border-none p-0 focus:ring-0" placeholder="KPI項目名を入力" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-3 rounded-2xl">
                            <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">目標値 (Target)</label>
                            <input type="number" value={tempScores.kpiT} onChange={e => setTempScores({...tempScores, kpiT: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black outline-none border-none p-0 focus:ring-0" />
                          </div>
                          <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                            <label className="text-[8px] font-black text-amber-400 uppercase block mb-1">実績値 (Actual)</label>
                            <input type="number" value={tempScores.kpiA} onChange={e => setTempScores({...tempScores, kpiA: parseInt(e.target.value) || 0})} className="w-full bg-transparent text-sm font-black outline-none border-none p-0 focus:ring-0" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div><label className="text-[8px] font-black text-slate-500 uppercase block mb-1 tracking-widest">審判期限 (Deadline)</label><input type="date" value={tempScores.decisionDate} onChange={e => setTempScores({...tempScores, decisionDate: e.target.value})} className="w-full bg-white/10 rounded-xl py-2 px-3 text-xs font-bold outline-none border-none" /></div>
                        <div><label className="text-[8px] font-black text-blue-400 uppercase block mb-1 tracking-widest">最終審判 (Verdict)</label><select value={tempScores.verdict} onChange={e => setTempScores({...tempScores, verdict: e.target.value})} className="w-full bg-white/10 rounded-xl py-2 px-3 text-xs font-bold outline-none border-none"><option value="Pending">Pending</option><option value="Scale-up">Scale-up</option><option value="Exit">Exit</option><option value="Archived">Archived</option></select></div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                       <div className="flex gap-2">{['Green', 'Yellow', 'Red'].map(s => ( <button key={s} onClick={() => setTempScores({...tempScores, status: s})} className={`flex-1 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${tempScores.status === s ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-transparent border-slate-100 text-slate-300'}`}>{s}</button>))}</div>
                       <textarea value={tempScores.insight} onChange={e => setTempScores({...tempScores, insight: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-[10px] font-bold outline-none h-24 border border-slate-100" placeholder="SSAA Insights: 現場の行動速度や摩擦に関する洞察を入力..." />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 border-t pt-4 border-slate-50">
                      <div className="p-4 bg-slate-50 rounded-3xl">
                        <div className="flex justify-between items-center mb-2 font-black"><span className="text-[9px] text-slate-400 uppercase tracking-widest flex items-center gap-1"><BarChart3 className="w-3 h-3" /> 売上進捗</span><span className="text-[10px] text-blue-600">{p.tRev > 0 ? Math.round((p.aRev / p.tRev) * 100) : 0}%</span></div>
                        <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mb-2"><div className="h-full bg-blue-500" style={{ width: `${Math.min((p.aRev / (p.tRev || 1)) * 100, 100)}%` }} /></div>
                        <p className="text-sm font-black text-slate-800 tracking-tight leading-none mt-1">¥{p.aRev.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-blue-50/30 rounded-3xl border border-blue-50/50">
                        <div className="text-[9px] font-black text-blue-400 uppercase mb-2 tracking-widest truncate">{p.kpiName || "KPI未設定"}</div>
                        <div className="flex items-end justify-between leading-none mt-1">
                          <p className="text-sm font-black text-blue-700">{p.kpiA.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-blue-400 opacity-60">/{p.kpiT.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-end border-t pt-4 border-slate-50 leading-none">
                      <div className="flex gap-4">
                        <div><p className="text-[8px] font-black text-slate-300 uppercase mb-2 tracking-widest">Sync</p><p className="text-lg font-black text-slate-700">{Math.round(p.x)}%</p></div>
                        <div><p className="text-[8px] font-black text-slate-300 uppercase mb-2 tracking-widest">Velocity</p><p className="text-lg font-black text-slate-700">{Math.round(p.y)}%</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase mb-2 tracking-widest italic font-bold">実績利益</p>
                        <p className={`text-sm font-black ${p.aProf >= (p.tProf || 0) ? 'text-green-600' : 'text-rose-600'}`}>¥{p.aProf.toLocaleString()}</p>
                      </div>
                    </div>
                    {p.insight && <div className="p-4 bg-blue-50/50 rounded-2xl border-l-4 border-blue-500 shadow-sm"><p className="text-[10px] font-bold text-blue-700 italic leading-relaxed whitespace-pre-wrap">"{p.insight}"</p></div>}
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