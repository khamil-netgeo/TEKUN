/**
 * Module 7 — CRM & Pemantauan Usahawan
 * VisitChecklistModal — post-visit data entry + AI report generation
 */
import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import type { FieldVisit } from '../types';
import { generateVisitReport } from '../services/entrepreneurService';
import toast from 'react-hot-toast';

const CHECKLIST_ITEMS = [
  'Premis perniagaan beroperasi',
  'Usahawan hadir semasa lawatan',
  'Rekod kewangan disemak',
  'Stok / inventori diperiksa',
  'Pekerja hadir',
  'Premis dalam keadaan baik',
  'Usahawan mematuhi syarat pembiayaan',
];

const CONDITION_OPTIONS = ['Baik', 'Sederhana', 'Lemah', 'Kritikal'] as const;
type ConditionOption = typeof CONDITION_OPTIONS[number];

interface Props {
  visit: FieldVisit;
  onClose: () => void;
  onReportGenerated: (visitId: number, report: string) => void;
}

export default function VisitChecklistModal({ visit, onClose, onReportGenerated }: Props) {
  const [checklist, setChecklist]     = useState<string[]>(visit.checklist_items ?? []);
  const [notes, setNotes]             = useState(visit.visit_notes ?? '');
  const [condition, setCondition]     = useState<ConditionOption>((visit.business_condition as ConditionOption) ?? 'Sederhana');
  const [revenue, setRevenue]         = useState(visit.reported_revenue?.toString() ?? '');
  const [employees, setEmployees]     = useState(visit.reported_employees?.toString() ?? '');
  const [generating, setGenerating]   = useState(false);
  const [report, setReport]           = useState(visit.ai_report ?? '');

  const toggleItem = (item: string) => {
    setChecklist(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateVisitReport(visit.id, {
        visit_notes:        notes,
        business_condition: condition,
        reported_revenue:   revenue ? parseFloat(revenue) : undefined,
        reported_employees: employees ? parseInt(employees) : undefined,
        force:              true,
      });
      setReport(result.report);
      onReportGenerated(visit.id, result.report);
      toast.success('Laporan AI berjaya dijana!');
    } catch {
      toast.error('Gagal menjana laporan AI. Cuba semula.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ background: '#1B2B5E' }}>
          <div>
            <h2 className="text-white font-bold text-lg">Senarai Semak Lawatan</h2>
            <p className="text-blue-200 text-xs mt-0.5">{visit.ref_no} — {visit.purpose}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Checklist */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Senarai Semak Lawatan</h3>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map(item => (
                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checklist.includes(item)
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300 group-hover:border-green-400'
                    }`}
                    onClick={() => toggleItem(item)}
                  >
                    {checklist.includes(item) && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Business condition */}
          <div>
            <label className="text-xs text-gray-500 block mb-1.5 font-medium">Keadaan Perniagaan</label>
            <div className="flex gap-2 flex-wrap">
              {CONDITION_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setCondition(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors ${
                    condition === opt
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* KPI fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">Pendapatan Bulanan (RM)</label>
              <input
                type="number"
                value={revenue}
                onChange={e => setRevenue(e.target.value)}
                placeholder="cth: 12500"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1 font-medium">Bilangan Pekerja</label>
              <input
                type="number"
                value={employees}
                onChange={e => setEmployees(e.target.value)}
                placeholder="cth: 4"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Visit notes */}
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Nota Pegawai</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Tuliskan pemerhatian semasa lawatan..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* AI Report */}
          {report && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700">Laporan AI Dijana</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{report}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
            >
              {generating ? (
                <><Loader2 size={14} className="animate-spin" /> Jana Laporan AI...</>
              ) : (
                <><Sparkles size={14} /> {report ? 'Jana Semula' : 'Jana Laporan AI'}</>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
