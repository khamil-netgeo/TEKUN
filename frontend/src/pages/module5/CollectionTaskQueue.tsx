/**
 * Module 5 — Collection Task Queue (Live API)
 * AI-prioritized inbox, log call outcome, schedule follow-up,
 * AI suggests best contact time/channel
 */
import React, { useState } from 'react';
import {
  Phone, MessageSquare, Clock, CheckCircle, XCircle,
  Calendar, Brain, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AiBadge, PageHeader, LoadingSpinner, toast } from '@/components/ui';
import { useCollectionTasks, useLogOutcome } from '@/modules/pengurusan-npl/hooks/useNpl';
import type { CollectionTask } from '@/modules/pengurusan-npl/hooks/useNpl';

const PRIORITY_COLOUR: Record<string, string> = {
  Kritikal:  '#C62828',
  Tinggi:    '#E65100',
  Sederhana: '#F57F17',
  Rendah:    '#2E7D32',
};

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  call:  <Phone className="w-4 h-4" />,
  sms:   <MessageSquare className="w-4 h-4" />,
  email: <MessageSquare className="w-4 h-4" />,
};

const OUTCOME_OPTIONS = [
  { value: 'promised_payment', label: 'Berjanji Bayar' },
  { value: 'partial_payment', label: 'Bayaran Separa' },
  { value: 'full_payment', label: 'Bayaran Penuh' },
  { value: 'no_answer', label: 'Tiada Jawapan' },
  { value: 'wrong_number', label: 'Nombor Salah' },
  { value: 'refused_payment', label: 'Enggan Bayar' },
  { value: 'restructure_request', label: 'Minta Penstrukturan Semula' },
];

interface OutcomeFormProps {
  task: CollectionTask;
  onClose: () => void;
  onSaved: () => void;
}

function OutcomeForm({ task, onClose, onSaved }: OutcomeFormProps) {
  const { log, loading } = useLogOutcome();
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState(7);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) { toast.error('Sila pilih hasil panggilan.'); return; }
    const ok = await log(task.id, outcome, notes, followUpDays);
    if (ok) {
      toast.success('Hasil panggilan direkod.');
      onSaved();
      onClose();
    } else {
      toast.error('Gagal merekod hasil panggilan.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1B2B5E]">Rekod Hasil Panggilan</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{task.borrower_name} — {task.account_no}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasil Panggilan *</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
            >
              <option value="">Pilih hasil...</option>
              {OUTCOME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Masukkan nota panggilan..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Susulan Dalam (hari)</label>
            <input
              type="number"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(Number(e.target.value))}
              min={1}
              max={90}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5E]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#1B2B5E] text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan Hasil'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CollectionTaskQueue() {
  const { t } = useTranslation();
  const { tasks, total, loading, error, refetch } = useCollectionTasks();
  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (loading) return <LoadingSpinner fullPage label="Memuatkan tugasan kutipan..." />;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Baris Gilir Tugasan Kutipan"
        subtitle="Senarai tugasan kutipan diutamakan oleh AI"
        breadcrumbs={[
          { label: 'SPPT', href: '/' },
          { label: 'Pemantauan NPL', href: '/module5/npl' },
          { label: 'Tugasan Kutipan' },
        ]}
        icon={<Phone className="w-6 h-6 text-white" />}
        action={<AiBadge label="AI Keutamaan Aktif" variant="gradient" />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Jumlah Tugasan', value: total, colour: '#1B2B5E' },
          { label: 'Kritikal', value: tasks.filter((t: CollectionTask) => t.priority_label === 'Kritikal').length, colour: '#C62828' },
          { label: 'Perlu Susulan Hari Ini', value: tasks.filter((t: CollectionTask) => t.follow_up_at && new Date(t.follow_up_at) <= new Date()).length, colour: '#E65100' },
          { label: 'Selesai Hari Ini', value: tasks.filter((t: CollectionTask) => t.status === 'completed').length, colour: '#2E7D32' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.colour }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Task Cards */}
      <div className="space-y-3">
        {tasks.map((task: CollectionTask) => {
          const isExpanded = expandedId === task.id;
          const priorityColour = PRIORITY_COLOUR[task.priority_label] ?? '#888';

          return (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Task Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Priority Badge */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: priorityColour }}>
                      P{task.priority_score > 80 ? 1 : task.priority_score > 60 ? 2 : task.priority_score > 40 ? 3 : 4}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{task.borrower_name}</span>
                        <span className="text-xs text-gray-400 font-mono">{task.account_no}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: priorityColour }}>
                          {task.priority_label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.arrears_days} hari tunggakan
                        </span>
                        <span className="font-semibold text-red-600">
                          RM {Number(task.arrears_amount).toLocaleString('ms-MY', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="flex items-center gap-1 text-purple-600">
                          {CHANNEL_ICON[task.ai_suggested_channel] ?? <Phone className="w-3 h-3" />}
                          AI: {task.ai_suggested_channel?.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock className="w-3 h-3" />
                          {task.ai_best_contact_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B2B5E] text-white rounded-lg text-xs font-medium hover:bg-blue-900 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Log Hasil
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded AI Recommendation */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                  <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                    <Brain className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-purple-700">Cadangan AI</span>
                        <AiBadge size="xs" />
                      </div>
                      <p className="text-xs text-gray-700">{task.ai_recommendation}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-gray-400">Percubaan</p>
                      <p className="font-semibold text-gray-700">{task.attempt_count} kali</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Hasil Terakhir</p>
                      <p className="font-semibold text-gray-700">{task.last_outcome ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Dihubungi Terakhir</p>
                      <p className="font-semibold text-gray-700">
                        {task.last_contacted_at ? new Date(task.last_contacted_at).toLocaleDateString('ms-MY') : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Susulan Seterusnya</p>
                      <p className="font-semibold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.follow_up_at ? new Date(task.follow_up_at).toLocaleDateString('ms-MY') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tasks.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
            <p className="font-medium">Tiada tugasan kutipan buat masa ini.</p>
          </div>
        )}
      </div>

      {/* Outcome Form Modal */}
      {selectedTask && (
        <OutcomeForm
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
