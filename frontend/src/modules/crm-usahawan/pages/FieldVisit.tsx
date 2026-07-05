/**
 * Module 7 — CRM & Pemantauan Usahawan
 * FieldVisit — Pengurusan Lawatan Tapak
 * Komponen wajib: PageHeader, DataTable, AiBadge, LoadingSpinner, Toast
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Clock, CheckCircle, XCircle,
  AlertTriangle, Sparkles, RefreshCw, Plus, ChevronLeft, ChevronRight,
  User,
} from 'lucide-react';
import { PageHeader, DataTable, LoadingSpinner, toast, ToastContainer, type Column } from '@/components/ui';
import { AiBadge } from '@/components/ai';
import {
  getEntrepreneurs, getVisits, scheduleVisit, generateVisitReport,
  type ScheduleVisitPayload,
} from '../services/entrepreneurService';
import type { Entrepreneur, FieldVisit as VisitType } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
const DAY_NAMES   = ['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'];

const STATUS_CLASS: Record<string, string> = {
  Selesai:           'bg-green-100 text-green-800',
  Dijadualkan:       'bg-blue-100 text-blue-800',
  'Dalam Perjalanan':'bg-orange-100 text-orange-800',
  Dibatalkan:        'bg-red-100 text-red-800',
  'Tidak Hadir':     'bg-yellow-100 text-yellow-800',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ── Schedule Visit Modal ──────────────────────────────────────────────────────
interface ScheduleModalProps {
  entrepreneurs: Entrepreneur[];
  onClose: () => void;
  onSuccess: () => void;
}
function ScheduleModal({ entrepreneurs, onClose, onSuccess }: ScheduleModalProps) {
  const [form, setForm] = useState<{
    entrepreneur_id: string;
    scheduled_date: string;
    scheduled_time: string;
    purpose: string;
  }>({ entrepreneur_id: '', scheduled_date: '', scheduled_time: '', purpose: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.entrepreneur_id || !form.scheduled_date || !form.purpose) {
      toast.error('Sila lengkapkan semua medan wajib.');
      return;
    }
    setLoading(true);
    try {
      const payload: ScheduleVisitPayload = {
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time || undefined,
        purpose: form.purpose,
      };
      await scheduleVisit(form.entrepreneur_id, payload);
      toast.success('Lawatan berjaya dijadualkan.');
      onSuccess();
      onClose();
    } catch {
      toast.error('Gagal menjadualkan lawatan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-[#1B2B5E]">Jadual Lawatan Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Usahawan *</label>
            <select
              value={form.entrepreneur_id}
              onChange={(e) => setForm(f => ({ ...f, entrepreneur_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]"
              required
            >
              <option value="">-- Pilih Usahawan --</option>
              {entrepreneurs.map(e => (
                <option key={e.id} value={e.ref_no}>{e.name} ({e.ref_no})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tarikh Lawatan *</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Masa</label>
              <input
                type="time"
                value={form.scheduled_time}
                onChange={(e) => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tujuan Lawatan *</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
              rows={3}
              placeholder="Nyatakan tujuan lawatan tapak..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B2B5E] resize-none"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg text-sm text-white disabled:opacity-60"
              style={{ background: '#1B2B5E' }}
            >
              {loading ? 'Menyimpan...' : 'Jadualkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FieldVisitPage() {
  const navigate = useNavigate();
  const today = new Date();

  const [calYear, setCalYear]       = useState(today.getFullYear());
  const [calMonth, setCalMonth]     = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allVisits, setAllVisits]   = useState<VisitType[]>([]);
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [reportLoading, setReportLoading] = useState<number | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const entRes = await getEntrepreneurs({ per_page: 100 });
      setEntrepreneurs(entRes.data);

      // Load visits for all entrepreneurs (up to first 20 for calendar)
      const visitPromises = entRes.data.slice(0, 20).map(e => getVisits(e.ref_no));
      const visitResults  = await Promise.allSettled(visitPromises);
      const allV: VisitType[] = [];
      visitResults.forEach(r => {
        if (r.status === 'fulfilled') allV.push(...(r.value.data ?? []));
      });
      setAllVisits(allV);
    } catch {
      toast.error('Gagal memuatkan data lawatan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDayOfMonth = getFirstDayOfMonth(calYear, calMonth);
  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getVisitsForDate = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allVisits.filter(v => v.scheduled_date === dateStr || v.actual_date === dateStr);
  };

  const selectedDateVisits = selectedDate
    ? allVisits.filter(v => v.scheduled_date === selectedDate || v.actual_date === selectedDate)
    : allVisits;

  // ── Generate AI report ────────────────────────────────────────────────────
  const handleGenerateReport = async (visit: VisitType) => {
    setReportLoading(visit.id);
    try {
      const res = await generateVisitReport(visit.id, {
        business_condition: visit.business_condition,
        reported_revenue:   visit.reported_revenue,
        reported_employees: visit.reported_employees,
        visit_notes:        visit.visit_notes,
        actual_date:        visit.actual_date,
      });
      setAllVisits(prev => prev.map(v =>
        v.id === visit.id
          ? { ...v, ai_report: res.report, has_ai_report: true, ai_report_generated_at: res.generated_at }
          : v,
      ));
      toast.success('Laporan SPPT AI berjaya dijana.');
    } catch {
      toast.error('Gagal menjana laporan SPPT AI.');
    } finally {
      setReportLoading(null);
    }
  };

  // ── DataTable columns ─────────────────────────────────────────────────────
  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'ref_no',
      header: 'ID Lawatan',
      render: (row) => {
        const v = row as unknown as VisitType;
        return <span className="font-mono text-xs text-[#1B2B5E] font-semibold">{v.ref_no}</span>;
      },
    },
    {
      key: 'purpose',
      header: 'Tujuan & Tarikh',
      render: (row) => {
        const v = row as unknown as VisitType;
        return (
          <div>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{v.purpose}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar size={10} />
              {v.actual_date ?? v.scheduled_date}
              {v.scheduled_time && ` · ${v.scheduled_time}`}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const v = row as unknown as VisitType;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[v.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {v.status}
          </span>
        );
      },
    },
    {
      key: 'business_condition',
      header: 'Keadaan Perniagaan',
      render: (row) => {
        const v = row as unknown as VisitType;
        if (!v.business_condition) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            v.business_condition === 'Baik' ? 'bg-green-100 text-green-700' :
            v.business_condition === 'Kritikal' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>{v.business_condition}</span>
        );
      },
    },
    {
      key: 'has_ai_report',
      header: 'Laporan SPPT AI',
      align: 'center',
      render: (row) => {
        const v = row as unknown as VisitType;
        if (v.has_ai_report) {
          return <AiBadge label="Dijana oleh SPPT AI" size="sm" />;
        }
        if (v.status === 'Selesai') {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); handleGenerateReport(v); }}
              disabled={reportLoading === v.id}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-white disabled:opacity-60"
              style={{ background: '#673AB7' }}
            >
              {reportLoading === v.id ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
              Jana
            </button>
          );
        }
        return <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      key: 'officer',
      header: 'Pegawai',
      render: (row) => {
        const v = row as unknown as VisitType;
        return (
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <User size={10} />
            {v.officer?.name ?? '—'}
          </span>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner />;

  const pendingCount  = allVisits.filter(v => v.status === 'Dijadualkan').length;
  const completedCount = allVisits.filter(v => v.status === 'Selesai').length;
  const aiReportCount = allVisits.filter(v => v.has_ai_report).length;

  return (
    <div className="space-y-5">
      <ToastContainer />
      {showModal && (
        <ScheduleModal
          entrepreneurs={entrepreneurs}
          onClose={() => setShowModal(false)}
          onSuccess={loadAll}
        />
      )}

      <PageHeader
        title="Pengurusan Lawatan Tapak"
        subtitle="Jadual dan rekod lawatan tapak usahawan TEKUN Nasional"
        breadcrumbs={[{ label: 'Utama' }, { label: 'CRM', href: '/crm' }, { label: 'Lawatan Tapak' }]}
        icon={<Calendar size={20} className="text-white" />}
        action={
          <div className="flex items-center gap-2">
            <AiBadge label="SPPT AI Reports" size="md" />
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white rounded-lg"
              style={{ background: '#1B2B5E' }}
            >
              <Plus size={14} /> Jadual Lawatan
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Dijadualkan',   value: pendingCount,   colour: '#1B2B5E' },
          { label: 'Selesai',       value: completedCount, colour: '#2E7D32' },
          { label: 'Laporan SPPT AI', value: aiReportCount, colour: '#673AB7' },
        ].map(({ label, value, colour }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: colour }}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Calendar + Visit list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>
              {MONTH_NAMES[calMonth]} {calYear}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calDays.map((day) => {
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayVisits = getVisitsForDate(day);
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                    isSelected ? 'text-white' :
                    isToday ? 'font-bold text-[#1B2B5E]' :
                    'text-gray-700 hover:bg-gray-50'
                  }`}
                  style={isSelected ? { background: '#1B2B5E' } : {}}
                >
                  {day}
                  {dayVisits.length > 0 && (
                    <div
                      className="absolute bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: isSelected ? 'white' : '#E65100' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{selectedDate}</span>
                <button onClick={() => setSelectedDate(null)} className="text-xs text-gray-400 hover:text-gray-600">
                  Papar semua
                </button>
              </div>
              <div className="text-xs font-medium mt-1" style={{ color: '#1B2B5E' }}>
                {selectedDateVisits.length} lawatan pada tarikh ini
              </div>
            </div>
          )}
        </div>

        {/* Visit list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>
              {selectedDate ? `Lawatan pada ${selectedDate}` : 'Semua Lawatan'} ({selectedDateVisits.length})
            </h3>
          </div>
          <DataTable
            columns={columns}
            data={selectedDateVisits as unknown as Record<string, unknown>[]}
            emptyMessage="Tiada lawatan dijumpai."
            rowKey={(row) => (row as unknown as VisitType).id}
          />
        </div>
      </div>
    </div>
  );
}
