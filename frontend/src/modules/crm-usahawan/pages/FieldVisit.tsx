/**
 * Module 7 — CRM & Pemantauan Usahawan
 * FieldVisit — Field visit scheduling, calendar view, checklist, AI report generation
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, MapPin, User, Clock, CheckCircle2, Loader2,
  Sparkles, Plus, Filter, ChevronLeft, ChevronRight,
  AlertCircle, FileText,
} from 'lucide-react';
import { getVisits } from '../services/entrepreneurService';
import type { FieldVisit as FieldVisitType } from '../types';
import VisitChecklistModal from '../components/VisitChecklistModal';
import ScheduleVisitModal from '../components/ScheduleVisitModal';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  'Dijadualkan': { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  'Dalam Proses':{ bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Selesai':     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  'Dibatalkan':  { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const MONTH_NAMES = [
  'Januari','Februari','Mac','April','Mei','Jun',
  'Julai','Ogos','September','Oktober','November','Disember',
];
const DAY_NAMES = ['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FieldVisit() {
  const [visits, setVisits]               = useState<FieldVisitType[]>([]);
  const [loading, setLoading]             = useState(true);
  const [calendarYear, setCalendarYear]   = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay]     = useState<Date | null>(null);
  const [filterStatus, setFilterStatus]   = useState('');
  const [showChecklist, setShowChecklist] = useState<FieldVisitType | null>(null);
  const [showSchedule, setShowSchedule]   = useState(false);
  const [view, setView]                   = useState<'calendar' | 'list'>('calendar');

  // ── Fetch visits ────────────────────────────────────────────────────────────

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVisits({ status: filterStatus || undefined, per_page: 100 });
      setVisits(res.data);
    } catch {
      toast.error('Gagal memuatkan senarai lawatan.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  // ── Calendar helpers ────────────────────────────────────────────────────────

  const firstDay  = new Date(calendarYear, calendarMonth, 1);
  const lastDay   = new Date(calendarYear, calendarMonth + 1, 0);
  const startPad  = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();
  const today     = new Date();

  const visitsOnDay = (d: number) => {
    const day = new Date(calendarYear, calendarMonth, d);
    return visits.filter(v => v.scheduled_date && isSameDay(new Date(v.scheduled_date), day));
  };

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarYear(y => y - 1); setCalendarMonth(11); }
    else setCalendarMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarYear(y => y + 1); setCalendarMonth(0); }
    else setCalendarMonth(m => m + 1);
  };

  const selectedDayVisits = selectedDay
    ? visits.filter(v => v.scheduled_date && isSameDay(new Date(v.scheduled_date), selectedDay))
    : [];

  // ── Filtered list view ──────────────────────────────────────────────────────

  const filteredVisits = filterStatus
    ? visits.filter(v => v.status === filterStatus)
    : visits;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="sppt-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>Lawatan Lapangan</h1>
            <p className="text-sm text-gray-500 mt-0.5">Jadual lawatan, senarai semak, dan laporan AI</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${
                  view === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar size={12} /> Kalendar
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors ${
                  view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText size={12} /> Senarai
              </button>
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Semua Status</option>
                <option value="Dijadualkan">Dijadualkan</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* New Visit */}
            <button
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold"
              style={{ background: '#2E7D32' }}
            >
              <Plus size={12} /> Jadual Lawatan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Dijadualkan',  count: visits.filter(v => v.status === 'Dijadualkan').length,  color: '#1B2B5E' },
          { label: 'Dalam Proses', count: visits.filter(v => v.status === 'Dalam Proses').length, color: '#F59E0B' },
          { label: 'Selesai',      count: visits.filter(v => v.status === 'Selesai').length,      color: '#2E7D32' },
          { label: 'Dibatalkan',   count: visits.filter(v => v.status === 'Dibatalkan').length,   color: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="sppt-card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="sppt-card flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      ) : view === 'calendar' ? (
        /* ── Calendar View ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar */}
          <div className="lg:col-span-2 sppt-card">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={16} />
              </button>
              <h3 className="font-bold text-sm" style={{ color: '#1B2B5E' }}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </h3>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding */}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const dayVisits = visitsOnDay(d);
                const thisDay   = new Date(calendarYear, calendarMonth, d);
                const isSelected = selectedDay && isSameDay(thisDay, selectedDay);
                const isToday_   = isSameDay(thisDay, today);
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(prev => prev && isSameDay(prev, thisDay) ? null : thisDay)}
                    className={`relative p-1.5 rounded-lg text-center transition-colors min-h-[44px] ${
                      isSelected ? 'bg-blue-600 text-white' :
                      isToday_   ? 'bg-blue-50 border border-blue-300' :
                      'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : isToday_ ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {d}
                    </div>
                    {dayVisits.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                        {dayVisits.slice(0, 3).map((v, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : STATUS_COLOR[v.status]?.dot ?? 'bg-gray-400'
                            }`}
                          />
                        ))}
                        {dayVisits.length > 3 && (
                          <span className={`text-[8px] font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            +{dayVisits.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail */}
          <div className="sppt-card">
            <h3 className="font-bold text-sm mb-3" style={{ color: '#1B2B5E' }}>
              {selectedDay
                ? `${selectedDay.getDate()} ${MONTH_NAMES[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`
                : 'Pilih tarikh'}
            </h3>
            {!selectedDay ? (
              <div className="text-center text-xs text-gray-400 py-8">
                Klik pada tarikh dalam kalendar untuk melihat lawatan.
              </div>
            ) : selectedDayVisits.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-8">
                Tiada lawatan pada tarikh ini.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayVisits.map(v => (
                  <VisitCard key={v.id} visit={v} onChecklist={() => setShowChecklist(v)} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── List View ──────────────────────────────────────────────────────── */
        <div className="sppt-card">
          {filteredVisits.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-12">Tiada lawatan ditemui.</div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.map(v => (
                <VisitCard key={v.id} visit={v} onChecklist={() => setShowChecklist(v)} showDate />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checklist Modal */}
      {showChecklist && (
        <VisitChecklistModal
          visit={showChecklist}
          onClose={() => setShowChecklist(null)}
          onReportGenerated={(visitId, report) => {
            setVisits(prev => prev.map(v =>
              v.id === visitId ? { ...v, ai_report: report, status: 'Selesai' } : v
            ));
          }}
        />
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <ScheduleVisitModal
          entrepreneurId=""
          entrepreneurName=""
          onClose={() => setShowSchedule(false)}
          onScheduled={() => {
            setShowSchedule(false);
            fetchVisits();
            toast.success('Lawatan berjaya dijadualkan!');
          }}
        />
      )}
    </div>
  );
}

// ── Visit Card Sub-component ──────────────────────────────────────────────────

function VisitCard({
  visit,
  onChecklist,
  showDate = false,
}: {
  visit: FieldVisitType;
  onChecklist: () => void;
  showDate?: boolean;
}) {
  const sc = STATUS_COLOR[visit.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };

  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-gray-800">
              {visit.entrepreneur?.name ?? visit.ref_no}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${sc.bg} ${sc.text}`}>
              {visit.status}
            </span>
            {visit.ai_report && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">
                <Sparkles size={8} /> Laporan AI
              </span>
            )}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">{visit.purpose}</div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 flex-wrap">
            {showDate && visit.scheduled_date && (
              <span className="flex items-center gap-1"><Calendar size={9} /> {visit.scheduled_date}</span>
            )}
            {visit.scheduled_time && (
              <span className="flex items-center gap-1"><Clock size={9} /> {visit.scheduled_time}</span>
            )}
            {visit.location && (
              <span className="flex items-center gap-1"><MapPin size={9} /> {visit.location}</span>
            )}
            {visit.officer?.name && (
              <span className="flex items-center gap-1"><User size={9} /> {visit.officer.name}</span>
            )}
          </div>
          {visit.checklist_items && visit.checklist_items.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <CheckCircle2 size={9} className="text-green-600" />
              <span className="text-[9px] text-gray-500">{visit.checklist_items.length} item disemak</span>
            </div>
          )}
        </div>

        <button
          onClick={onChecklist}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
        >
          {visit.status === 'Selesai' ? (
            <><AlertCircle size={10} /> Semak</>
          ) : (
            <><Sparkles size={10} /> Jana Laporan</>
          )}
        </button>
      </div>
    </div>
  );
}
