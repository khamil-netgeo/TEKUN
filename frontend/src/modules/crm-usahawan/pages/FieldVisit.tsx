import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar, Plus, RefreshCw, Search, CheckCircle, Clock, XCircle,
  MapPin, User, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { entrepreneurService } from '../services/entrepreneurService';
import type { FieldVisit as FieldVisitType, Entrepreneur } from '../types';
import { ScheduleVisitModal } from '../components/ScheduleVisitModal';

const STATUS_STYLES: Record<string, string> = {
  Dijadualkan: 'bg-blue-100 text-blue-800',
  Selesai: 'bg-green-100 text-green-800',
  Dibatalkan: 'bg-gray-100 text-gray-600',
  'Tidak Hadir': 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Dijadualkan: <Clock size={14} />,
  Selesai: <CheckCircle size={14} />,
  Dibatalkan: <XCircle size={14} />,
  'Tidak Hadir': <XCircle size={14} />,
};

export default function FieldVisitPage() {
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState<Entrepreneur | null>(null);
  const [visits, setVisits] = useState<FieldVisitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<FieldVisitType | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    entrepreneurService.list({ per_page: 50 }).then(r => setEntrepreneurs(r.data));
  }, []);

  const loadVisits = useCallback(async (entrepreneurId: string) => {
    setLoading(true);
    try {
      const res = await entrepreneurService.getVisits(entrepreneurId, {
        status: statusFilter || undefined,
      });
      setVisits(res.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (selectedEntrepreneur) {
      loadVisits(selectedEntrepreneur.ref_no);
    }
  }, [selectedEntrepreneur, loadVisits]);

  const handleGenerateReport = async (visit: FieldVisitType) => {
    setGeneratingReport(true);
    try {
      const result = await entrepreneurService.generateReport(visit.id, {
        observations: 'Lawatan lapangan telah dilaksanakan.',
      });
      setVisits(prev => prev.map(v => v.id === visit.id ? result.visit : v));
      setSelectedVisit(result.visit);
    } finally {
      setGeneratingReport(false);
    }
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const visitsByDate = visits.reduce<Record<string, FieldVisitType[]>>((acc, v) => {
    const d = v.scheduled_date.split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(v);
    return acc;
  }, {});

  const filteredEntrepreneurs = entrepreneurs.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.ref_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const monthName = currentMonth.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
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
            <Plus size={16} />
            Jadual Lawatan
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Entrepreneur Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Pilih Usahawan</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari usahawan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-96">
            {filteredEntrepreneurs.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEntrepreneur(e)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  selectedEntrepreneur?.id === e.id ? 'bg-blue-50 border-l-2 border-l-[#1B2B5E]' : ''
                }`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                <p className="text-xs text-gray-500">{e.ref_no} · {e.skim}</p>
              </button>
            ))}
            {filteredEntrepreneurs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Tiada usahawan dijumpai.</p>
            )}
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-900 capitalize">{monthName}</span>
            <button
              onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Ah', 'Is', 'Se', 'Ra', 'Kh', 'Ju', 'Sa'].map(d => (
              <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayVisits = visitsByDate[dateStr] ?? [];
              const isToday = dateStr === today;
              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs cursor-pointer transition-colors ${
                    isToday ? 'bg-[#1B2B5E] text-white' :
                    dayVisits.length > 0 ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                    'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{day}</span>
                  {dayVisits.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-blue-500'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visit List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">
              {selectedEntrepreneur ? `Lawatan — ${selectedEntrepreneur.name}` : 'Senarai Lawatan'}
            </h2>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Dijadualkan">Dijadualkan</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
          {!selectedEntrepreneur ? (
            <div className="text-center py-12 text-gray-400">
              <User size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Pilih usahawan untuk melihat lawatan.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-[#1B2B5E]" size={24} />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Tiada lawatan dijumpai.</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-80 divide-y divide-gray-50">
              {visits.map(visit => (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[visit.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_ICONS[visit.status]}
                      {visit.status}
                    </span>
                    <span className="text-xs text-gray-400">{visit.ref_no}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{visit.purpose}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(visit.scheduled_date).toLocaleDateString('ms-MY')} {visit.scheduled_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {visit.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                  {generatingReport ? 'Menjana...' : 'Jana Laporan AI'}
                </button>
              )}
              <button onClick={() => setSelectedVisit(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <XCircle size={16} />
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
          {selectedVisit.ai_report && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">AI Laporan</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedVisit.ai_report}</p>
            </div>
          )}
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

      {/* Schedule Modal */}
      {showScheduleModal && selectedEntrepreneur && (
        <ScheduleVisitModal
          entrepreneurId={selectedEntrepreneur.ref_no}
          entrepreneurName={selectedEntrepreneur.name}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            loadVisits(selectedEntrepreneur.ref_no);
          }}
        />
      )}
    </div>
  );
}
