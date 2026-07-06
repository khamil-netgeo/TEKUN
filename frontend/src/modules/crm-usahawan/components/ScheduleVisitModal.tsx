import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { scheduleVisit } from '../services/entrepreneurService';
import type { FieldVisit } from '../types';
import toast from 'react-hot-toast';
import api from '@/services/api';

interface Props {
  entrepreneurId: string | number;
  entrepreneurName: string;
  onClose: () => void;
  onScheduled: (visit: FieldVisit) => void;
}

export default function ScheduleVisitModal({ entrepreneurId, entrepreneurName, onClose, onScheduled }: Props) {
  const [purposes, setPurposes] = useState<string[]>([]);
  const [date, setDate]       = useState('');
  const [time, setTime]       = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/reference/visit-purposes')
      .then(res => {
        const data = res.data?.data || res.data || [];
        const mapped = data.map((item: any) => typeof item === 'string' ? item : item.name || item.label || item.value);
        setPurposes(mapped);
        if (mapped.length > 0) setPurpose(mapped[0]);
      })
      .catch(() => {
        const fallback = [
          'Pemantauan Perniagaan',
          'Tindakan Susulan NPL',
          'Penilaian Semula',
          'Lawatan Pertama',
          'Penilaian Akhir',
          'Lain-lain',
        ];
        setPurposes(fallback);
        setPurpose(fallback[0]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { toast.error('Sila pilih tarikh lawatan.'); return; }
    if (!location) { toast.error('Sila masukkan lokasi lawatan.'); return; }
    setLoading(true);
    try {
      const result = await scheduleVisit(entrepreneurId, {
        scheduled_date: date,
        scheduled_time: time || undefined,
        purpose,
        location,
      });
      toast.success('Lawatan lapangan berjaya dijadualkan!');
      onScheduled(result.visit);
      onClose();
    } catch {
      toast.error('Gagal menjadualkan lawatan. Cuba semula.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b" style={{ background: '#1B2B5E' }}>
          <div>
            <h2 className="text-white font-bold">Jadual Lawatan Baru</h2>
            <p className="text-blue-200 text-xs mt-0.5">{entrepreneurName}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Tujuan Lawatan</label>
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {purposes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Lokasi Lawatan *</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
              placeholder="Masukkan lokasi lawatan"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Tarikh Lawatan *</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Masa (pilihan)</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
              style={{ background: '#1B2B5E' }}
            >
              <Calendar size={14} />
              {loading ? 'Menyimpan...' : 'Jadualkan Lawatan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}