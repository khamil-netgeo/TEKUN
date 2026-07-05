import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Plus, RefreshCw, Search, CheckCircle, Clock, XCircle,
  MapPin, User, FileText, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { getEntrepreneurs, getVisits, scheduleVisit, generateVisitReport } from '../services/entrepreneurService';
import type { FieldVisit as FieldVisitType, Entrepreneur } from '../types';
import ScheduleVisitModal from '../components/ScheduleVisitModal';

const STATUS_STYLES: Record<string, string> = {
  Dijadualkan: 'bg-blue-100 text-blue-800',
  Selesai: 'bg-green-100 text-green-800',
  Dibatalkan: 'bg-gray-100 text-gray-600',
  'Tidak Hadir': 'bg-red-100 text-red-800',
  'Dalam Perjalanan': 'bg-yellow-100 text-yellow-800',
};

const MONTH_NAMES = [
  'Januari','Februari','Mac','April','Mei','Jun',
  'Julai','Ogos','September','Oktober','November','Disember',
];

export default function FieldVisitPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState<Entrepreneur | null>(null);
  const [visits, setVisits] = useState<FieldVisitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<FieldVisitType | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const prevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  useEffect(() => {
    getEntrepreneurs({ per_page: 50 }).then(r => setEntrepreneurs(r.data));
  }, []);

  const loadVisits = useCallback(async (entrepreneurId: string) => {
    setLoading(true);
    try {
      const res = await getVisits(entrepreneurId);
      setVisits(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEntrepreneur) {
      loadVisits(selectedEntrepreneur.ref_no);
    }
  }, [selectedEntrepreneur, loadVisits]);

  const handleGenerateReport = async (visit: FieldVisitType) => {
    setGeneratingReport(true);
    try {
      const result = await generateVisitReport(visit.id, {
        visit_notes: 'Lawatan lapangan telah dilaksanakan.',
      });
      const updatedVisit = { ...visit, ai_report: result.report, has_ai_report: true };
      setVisits(prev => prev.map(v => v.id === visit.id ? updatedVisit : v));
      setSelectedVisit(updatedVisit);
    } finally {
      setGeneratingReport(false);
    }
  };

  const filteredEntrepreneurs = entrepreneurs.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.ref_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVisits = visits.filter(v =>
    !statusFilter || v.status === statusFilter
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B5E]">Lawatan Lapangan</h1>
          <p className="text-sm text-gray-500 mt-1">Jadual dan pengurusan lawatan usahawan</p>
        </div>
        {selectedEntrepreneur && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2B5E] text-white rounded-lg text-sm hover:bg-blue-900"
          >
            <Plus size={16} /> Jadual Lawatan
          </button>
        )}
      </div>

      {/* Entrepreneur Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <User size={18} className="text-[#1B2B5E]" />
          <h2 className="font-semibold text-gray-800">Pilih Usahawan</h2>
        </div>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau no. rujukan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {filteredEntrepreneurs.map(e => (
            <button
              key={e.id}
              onClick={() => setSelectedEntrepreneur(e)}
              className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                selectedEntrepreneur?.id === e.id
                  ? 'border-[#1B2B5E] bg-blue-50 text-[#1B2B5E]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{e.name}</div>
              <div className="text-xs text-gray-500">{e.ref_no}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedEntrepreneur && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Semua Status</option>
                <option value="Dijadualkan">Dijadualkan</option>
                <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                <option value="Selesai">Selesai</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
              <button
                onClick={() => loadVisits(selectedEntrepreneur.ref_no)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white shadow text-[#1B2B5E]' : 'text-gray-500'}`}
              >
                Senarai
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-white shadow text-[#1B2B5E]' : 'text-gray-500'}`}
              >
                Kalendar
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          ) : view === 'calendar' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft size={18} />
                </button>
                <h3 className="font-semibold text-gray-800">
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight size={18} />
                </button>
              </div>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
                {['Ahd','Isn','Sel','Rab','Kha','Jum','Sab'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, i) => {
                  const d = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const dayVisits = filteredVisits.filter(v => v.scheduled_date === dateStr);
                  const isToday = dateStr === today;
                  return (
                    <div
                      key={d}
                      className={`min-h-[60px] p-1 rounded-lg border text-xs ${isToday ? 'border-[#1B2B5E] bg-blue-50' : 'border-gray-100'}`}
                    >
                      <div className={`font-medium mb-1 ${isToday ? 'text-[#1B2B5E]' : 'text-gray-700'}`}>{d}</div>
                      {dayVisits.map(v => (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVisit(v)}
                          className="truncate cursor-pointer rounded px-1 py-0.5 bg-blue-100 text-blue-800 mb-0.5 hover:bg-blue-200"
                        >
                          {v.purpose}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisits.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
                  <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Tiada lawatan dijumpai</p>
                </div>
              ) : filteredVisits.map(visit => (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-[#1B2B5E] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[visit.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {visit.status}
                        </span>
                        <span className="text-xs text-gray-400">{visit.ref_no}</span>
                      </div>
                      <h3 className="font-medium text-gray-900">{visit.purpose}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {visit.scheduled_date}
                          {visit.scheduled_time && ` ${visit.scheduled_time}`}
                        </span>
                        {visit.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {visit.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {visit.has_ai_report && (
                      <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        Laporan AI
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visit Detail Panel */}
          {selectedVisit && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedVisit.purpose}</h3>
                  <p className="text-sm text-gray-500">{selectedVisit.ref_no}</p>
                </div>
                <div className="flex gap-2">
                  {selectedVisit.status === 'Dijadualkan' && (
                    <button
                      onClick={() => handleGenerateReport(selectedVisit)}
                      disabled={generatingReport}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      <FileText size={14} />
                      {generatingReport ? 'Menjana...' : 'Jana Laporan SPPT AI'}
                    </button>
                  )}
                  <button onClick={() => setSelectedVisit(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
              {selectedVisit.ai_report && (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">SPPT AI Laporan</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedVisit.ai_report}</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Dijadualkan',  count: visits.filter(v => v.status === 'Dijadualkan').length,  color: '#1B2B5E' },
              { label: 'Dalam Perjalanan', count: visits.filter(v => v.status === 'Dalam Perjalanan').length, color: '#F59E0B' },
              { label: 'Selesai',      count: visits.filter(v => v.status === 'Selesai').length,      color: '#2E7D32' },
              { label: 'Dibatalkan',   count: visits.filter(v => v.status === 'Dibatalkan').length,   color: '#DC2626' },
            ].map(s => (
              <div key={s.label} className="sppt-card p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedEntrepreneur && (
        <ScheduleVisitModal
          entrepreneurId={selectedEntrepreneur.id}
          entrepreneurName={selectedEntrepreneur.name}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={(visit) => {
            setShowScheduleModal(false);
            setVisits(prev => [visit, ...prev]);
          }}
        />
      )}
    </div>
  );
}
