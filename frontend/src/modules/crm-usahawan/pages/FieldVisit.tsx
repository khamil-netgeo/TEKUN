// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Plus, Calendar, List, Loader2, MapPin, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AiBadge } from '@/components/ui/AiBadge';
import { entrepreneurService } from '../services/entrepreneurService';

export default function FieldVisitPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const data = await entrepreneurService.getVisits();
      setVisits(data?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    Dijadualkan: "bg-blue-100 text-blue-700",
    "Dalam Proses": "bg-orange-100 text-orange-700",
    Selesai: "bg-green-100 text-green-700",
    Dibatalkan: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lawatan Lapangan"
        subtitle="Jadual dan pengurusan lawatan usahawan"
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-navy-900">Senarai Lawatan</h2>
          </div>
          {visits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Tiada lawatan dijadualkan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {visits.map((visit: any) => (
                <div
                  key={visit.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{visit.purpose || visit.entrepreneur_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleDateString("ms-MY") : "—"}
                        </span>
                        {visit.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {visit.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={"px-2 py-0.5 rounded-full text-xs font-semibold " + (statusColor[visit.status] || "bg-gray-100 text-gray-700")}>
                      {visit.status}
                    </span>
                  </div>
                  {visit.ai_report && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AiBadge>Laporan SPPT AI</AiBadge>
                      </div>
                      <p className="text-xs text-gray-700">{visit.ai_report}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
