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
      await fetchData(); // スプレッドシートから最新状態を再取得
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderSlider = (label: string, key: string) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-blue-600 font-bold">{tempScores[key]} / 5</span>
      </div>
      <input
        type="range" min="1" max="5" step="1"
        value={tempScores[key]}
        onChange={(e) => setTempScores({ ...tempScores, [key]: parseInt(e.target.value) })}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-9